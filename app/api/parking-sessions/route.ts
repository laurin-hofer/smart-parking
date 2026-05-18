import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return NextResponse.json(
    await prisma.parkingSession.findMany({
      include: { vehicle: true, parkingSpot: true },
      orderBy: { entryTime: "desc" }
    })
  );
}
