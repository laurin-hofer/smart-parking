import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logEvent } from "@/services/logService";
import type { SpotStatus } from "@/types";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spot = await query('SELECT * FROM "parking_spots" WHERE "id" = $1', [id]).then((r) => r.rows[0] ?? null);
  return NextResponse.json(spot);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { status: SpotStatus };

  const spot = await query(
    'UPDATE "parking_spots" SET "status" = $2, "updatedAt" = NOW() WHERE "id" = $1 RETURNING *',
    [id, body.status]
  ).then((r) => r.rows[0]);

  await logEvent({
    type: "admin_manual_action",
    message: `${spot.code} manually set to ${body.status}.`,
    spotCode: spot.code
  });

  return NextResponse.json(spot);
}
