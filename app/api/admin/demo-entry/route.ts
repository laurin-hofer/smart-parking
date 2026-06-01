import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { completeEntry } from "@/services/hardwareService";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { plate?: string; spotCode?: string };

  const plate = body.plate ?? `DEMO-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  let spotCode = body.spotCode;
  if (!spotCode) {
    const freeSpot = await query(
      'SELECT * FROM "parking_spots" WHERE "status" = $1 ORDER BY "code" ASC LIMIT 1',
      ["FREE"]
    ).then((r) => r.rows[0]);
    if (!freeSpot) {
      return NextResponse.json({ error: "No free parking spot available for demo" }, { status: 409 });
    }
    spotCode = freeSpot.code;
  }

  const result = await completeEntry(plate, spotCode!, "admin-demo");
  return NextResponse.json(result);
}
