import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSpotStatus, type SpotStatus } from "@/services/sensorService";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(await prisma.parkingSpot.findUnique({ where: { id }, include: { assignedVehicle: true } }));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { status: SpotStatus; assignedVehicleId?: string | null };
  return NextResponse.json(await setSpotStatus(id, body.status, body.assignedVehicleId));
}
