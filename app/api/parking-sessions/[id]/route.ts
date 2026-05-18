import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { endSession } from "@/services/barrierService";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(
    await prisma.parkingSession.findUnique({
      where: { id },
      include: { vehicle: true, parkingSpot: true }
    })
  );
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { isPaid?: boolean; forceExit?: boolean };
  if (body.forceExit) return NextResponse.json(await endSession(id, true));
  if (body.isPaid !== undefined) {
    return NextResponse.json(await prisma.parkingSession.update({ where: { id }, data: { isPaid: body.isPaid } }));
  }
  return NextResponse.json({ ok: true });
}
