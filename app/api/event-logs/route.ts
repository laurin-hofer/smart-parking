import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  const type = request.nextUrl.searchParams.get("type");
  return NextResponse.json(
    await prisma.eventLog.findMany({
      where: {
        type: type || undefined,
        OR: query
          ? [
              { message: { contains: query } },
              { licensePlate: { contains: query } },
              { parkingSpotName: { contains: query } }
            ]
          : undefined
      },
      orderBy: { createdAt: "desc" },
      take: 150
    })
  );
}
