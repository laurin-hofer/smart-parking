import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ReservationStatus = "ACTIVE" | "USED" | "CANCELLED" | "EXPIRED";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(await prisma.reservation.findUnique({ where: { id }, include: { vehicle: true, parkingSpot: true } }));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { status: ReservationStatus };
  return NextResponse.json(await prisma.reservation.update({ where: { id }, data: { status: body.status } }));
}
