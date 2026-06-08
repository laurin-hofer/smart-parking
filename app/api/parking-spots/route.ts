import { NextRequest, NextResponse } from "next/server";
import { createId, query } from "@/lib/db";
import { listParkingSpotsWithOccupancy } from "@/services/parkingSpotService";
import type { SpotStatus } from "@/types";

export async function GET() {
  return NextResponse.json(await listParkingSpotsWithOccupancy());
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { code: string; status?: SpotStatus; sensorId?: string };
  const spot = await query(
    `INSERT INTO "parking_spots" ("id", "code", "status", "sensorId")
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [createId(), body.code, body.status ?? "FREE", body.sensorId ?? null]
  ).then((r) => r.rows[0]);
  return NextResponse.json(spot, { status: 201 });
}
