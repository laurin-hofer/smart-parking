import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const sessions = await query(
    `SELECT
       s.*,
       row_to_json(v.*) AS vehicle,
       CASE WHEN p."id" IS NULL THEN NULL ELSE row_to_json(p.*) END AS spot
     FROM "parking_sessions" s
     JOIN "vehicles" v ON v."id" = s."vehicleId"
     LEFT JOIN "parking_spots" p ON p."id" = s."spotId"
     ORDER BY s."enteredAt" DESC`
  ).then((r) => r.rows);
  return NextResponse.json(sessions);
}
