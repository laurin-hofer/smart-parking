import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handlePlateDetected, endSession } from "@/services/barrierService";

export async function POST() {
  const active = await prisma.parkingSession.findMany({ where: { status: "ACTIVE" } });
  if (active.length && Math.random() > 0.55) {
    const session = active[Math.floor(Math.random() * active.length)];
    return NextResponse.json(await endSession(session.id, true));
  }
  const vehicles = await prisma.vehicle.findMany();
  const candidates = vehicles.length ? vehicles : [{ licensePlate: "UNKNOWN-404" }];
  const vehicle = candidates[Math.floor(Math.random() * candidates.length)];
  return NextResponse.json(await handlePlateDetected(vehicle.licensePlate));
}
