import { prisma } from "@/lib/prisma";
import { logEvent } from "@/services/logService";

export type SpotStatus = "FREE" | "RESERVED" | "OCCUPIED" | "MAINTENANCE";

export async function setSpotStatus(id: string, status: SpotStatus, assignedVehicleId?: string | null) {
  const spot = await prisma.parkingSpot.update({
    where: { id },
    data: {
      status,
      assignedVehicleId: status === "FREE" || status === "MAINTENANCE" ? null : assignedVehicleId
    },
    include: { assignedVehicle: true }
  });

  await logEvent({
    type: status === "FREE" ? "spot_freed" : status === "OCCUPIED" ? "spot_occupied" : "admin_manual_action",
    message: `${spot.name} was set to ${status.toLowerCase()}.`,
    licensePlate: spot.assignedVehicle?.licensePlate,
    parkingSpotName: spot.name
  });
  return spot;
}

export async function updateSpotByName(name: string, status: SpotStatus) {
  const spot = await prisma.parkingSpot.findUnique({ where: { name } });
  if (!spot) throw new Error("Parking spot not found");

  // When sensor reports OCCUPIED: link the oldest PENDING session to this spot
  if (status === "OCCUPIED") {
    const pendingSession = await prisma.parkingSession.findFirst({
      where: { status: "PENDING" },
      orderBy: { entryTime: "asc" },
      include: { vehicle: true }
    });

    if (pendingSession) {
      await prisma.$transaction(async (tx) => {
        await tx.parkingSession.update({
          where: { id: pendingSession.id },
          data: { parkingSpotId: spot.id, status: "ACTIVE" }
        });
        await tx.parkingSpot.update({
          where: { id: spot.id },
          data: { status: "OCCUPIED", assignedVehicleId: pendingSession.vehicleId }
        });
      });

      await logEvent({
        type: "spot_occupied",
        message: `${pendingSession.vehicle.licensePlate} was assigned to ${spot.name} by sensor.`,
        licensePlate: pendingSession.vehicle.licensePlate,
        parkingSpotName: spot.name
      });

      return prisma.parkingSpot.findUnique({ where: { id: spot.id }, include: { assignedVehicle: true } });
    }
  }

  return setSpotStatus(spot.id, status);
}
