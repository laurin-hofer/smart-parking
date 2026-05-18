import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/services/logService";

export async function GET() {
  return NextResponse.json(
    await prisma.reservation.findMany({
      include: { vehicle: true, parkingSpot: true },
      orderBy: { createdAt: "desc" }
    })
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { vehicleId: string; parkingSpotId: string; validUntil?: string };
  const reservation = await prisma.$transaction(async (tx) => {
    const created = await tx.reservation.create({
      data: {
        vehicleId: body.vehicleId,
        parkingSpotId: body.parkingSpotId,
        validUntil: body.validUntil ? new Date(body.validUntil) : new Date(Date.now() + 60 * 60 * 1000)
      },
      include: { vehicle: true, parkingSpot: true }
    });
    await tx.parkingSpot.update({ where: { id: body.parkingSpotId }, data: { status: "RESERVED" } });
    return created;
  });
  await logEvent({
    type: "reservation_created",
    message: `${reservation.vehicle.licensePlate} reserved ${reservation.parkingSpot.name}.`,
    licensePlate: reservation.vehicle.licensePlate,
    parkingSpotName: reservation.parkingSpot.name
  });
  return NextResponse.json(reservation, { status: 201 });
}
