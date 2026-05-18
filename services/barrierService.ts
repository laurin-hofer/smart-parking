import { prisma } from "@/lib/prisma";
import { currentFee, normalizePlate } from "@/lib/utils";
import { logEvent } from "@/services/logService";

export async function handlePlateDetected(licensePlate: string) {
  const normalized = normalizePlate(licensePlate);

  let vehicle = await prisma.vehicle.findUnique({ where: { licensePlate: normalized } });

  if (!vehicle) {
    // Auto-register unknown plate as guest — admin can update details later
    vehicle = await prisma.vehicle.create({
      data: { licensePlate: normalized, ownerName: "Guest", isAllowed: true }
    });
    await logEvent({
      type: "license_plate_added",
      message: `${normalized} was auto-registered as a guest vehicle.`,
      licensePlate: normalized
    });
  }

  if (!vehicle.isAllowed) {
    await logEvent({
      type: "barrier_denied",
      message: `${normalized} was denied at the entry barrier (access disabled).`,
      licensePlate: normalized
    });
    return { opened: false, reason: "Access disabled for this vehicle", vehicle };
  }

  // If the car is already inside (active or pending), open exit barrier
  const existingSession = await prisma.parkingSession.findFirst({
    where: { vehicleId: vehicle.id, status: { in: ["ACTIVE", "PENDING"] } },
    include: { parkingSpot: true }
  });

  if (existingSession) {
    await logEvent({
      type: "barrier_opened",
      message: `${vehicle.licensePlate} is already inside. Exit barrier opened.`,
      licensePlate: vehicle.licensePlate,
      parkingSpotName: existingSession.parkingSpot?.name
    });
    return { opened: true, direction: "exit", session: existingSession };
  }

  // Check for free spots (deny if none available)
  const reservation = await prisma.reservation.findFirst({
    where: { vehicleId: vehicle.id, status: "ACTIVE", validUntil: { gt: new Date() } },
    include: { parkingSpot: true }
  });

  const hasReservation = !!reservation?.parkingSpot;
  const freeSpotExists = hasReservation || !!(await prisma.parkingSpot.findFirst({ where: { status: "FREE" } }));

  if (!freeSpotExists) {
    await logEvent({
      type: "barrier_denied",
      message: `${vehicle.licensePlate} was denied — no free spot available.`,
      licensePlate: vehicle.licensePlate
    });
    return { opened: false, reason: "No free parking spot available", vehicle };
  }

  // If there is a reservation, pre-assign the spot immediately
  if (reservation) {
    await prisma.reservation.update({ where: { id: reservation.id }, data: { status: "USED" } });
    const session = await prisma.$transaction(async (tx) => {
      await tx.parkingSpot.update({
        where: { id: reservation.parkingSpot.id },
        data: { status: "OCCUPIED", assignedVehicleId: vehicle!.id }
      });
      return tx.parkingSession.create({
        data: { vehicleId: vehicle!.id, parkingSpotId: reservation.parkingSpot.id, status: "ACTIVE" },
        include: { vehicle: true, parkingSpot: true }
      });
    });
    await logEvent({
      type: "car_entered",
      message: `${vehicle.licensePlate} entered via reservation → ${reservation.parkingSpot.name}.`,
      licensePlate: vehicle.licensePlate,
      parkingSpotName: reservation.parkingSpot.name
    });
    await logEvent({ type: "barrier_opened", message: `Entry barrier opened for ${vehicle.licensePlate}.`, licensePlate: vehicle.licensePlate });
    return { opened: true, direction: "entry", session };
  }

  // No reservation — create a PENDING session; sensor will assign the spot
  const session = await prisma.parkingSession.create({
    data: { vehicleId: vehicle.id, status: "PENDING" },
    include: { vehicle: true, parkingSpot: true }
  });

  await logEvent({
    type: "car_entered",
    message: `${vehicle.licensePlate} entered. Waiting for sensor to assign a spot.`,
    licensePlate: vehicle.licensePlate
  });
  await logEvent({
    type: "barrier_opened",
    message: `Entry barrier opened for ${vehicle.licensePlate}.`,
    licensePlate: vehicle.licensePlate
  });

  return { opened: true, direction: "entry", session };
}

export async function endSession(sessionId: string, force = false) {
  const session = await prisma.parkingSession.findUnique({
    where: { id: sessionId },
    include: { vehicle: true, parkingSpot: true }
  });
  if (!session || !["ACTIVE", "PENDING"].includes(session.status)) {
    throw new Error("Active session not found");
  }

  const totalCost = session.parkingSpotId ? currentFee(session.entryTime, session.totalCost) : 0;
  if (!session.isPaid && !force) {
    throw new Error("Payment required before exit");
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (session.parkingSpotId) {
      await tx.parkingSpot.update({
        where: { id: session.parkingSpotId },
        data: { status: "FREE", assignedVehicleId: null }
      });
    }
    return tx.parkingSession.update({
      where: { id: session.id },
      data: { status: "FINISHED", exitTime: new Date(), totalCost, isPaid: force ? true : session.isPaid },
      include: { vehicle: true, parkingSpot: true }
    });
  });

  await logEvent({
    type: "car_exited",
    message: `${session.vehicle.licensePlate} exited${session.parkingSpot ? ` from ${session.parkingSpot.name}` : ""}.`,
    licensePlate: session.vehicle.licensePlate,
    parkingSpotName: session.parkingSpot?.name
  });
  if (session.parkingSpot) {
    await logEvent({
      type: "spot_freed",
      message: `${session.parkingSpot.name} is free again.`,
      licensePlate: session.vehicle.licensePlate,
      parkingSpotName: session.parkingSpot.name
    });
  }
  return updated;
}
