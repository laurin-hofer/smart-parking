import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SpotStatus } from "@/services/sensorService";

export async function GET() {
  return NextResponse.json(
    await prisma.parkingSpot.findMany({ include: { assignedVehicle: true }, orderBy: { name: "asc" } })
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { name: string; status?: SpotStatus };
  const spot = await prisma.parkingSpot.create({ data: { name: body.name, status: body.status ?? "FREE" } });
  return NextResponse.json(spot, { status: 201 });
}
