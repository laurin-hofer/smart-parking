import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { normalizePlate } from "@/lib/utils";
import { calculatePriceCents } from "@/lib/pricing";

export async function GET(request: NextRequest) {
  const plate = request.nextUrl.searchParams.get("plate");
  if (!plate) {
    return NextResponse.json({ error: "plate query parameter required" }, { status: 400 });
  }

  const normalized = normalizePlate(plate);
  const vehicle = await query('SELECT * FROM "vehicles" WHERE "licensePlate" = $1', [normalized]).then((r) => r.rows[0]);
  if (!vehicle) {
    return NextResponse.json(null);
  }

  const session = await query(
    `SELECT
       s.*,
       row_to_json(v.*) AS vehicle,
       CASE WHEN p."id" IS NULL THEN NULL ELSE row_to_json(p.*) END AS spot
     FROM "parking_sessions" s
     JOIN "vehicles" v ON v."id" = s."vehicleId"
     LEFT JOIN "parking_spots" p ON p."id" = s."spotId"
     WHERE s."vehicleId" = $1 AND s."status" = ANY($2)
     ORDER BY s."enteredAt" DESC
     LIMIT 1`,
    [vehicle.id, ["ACTIVE", "PAID"]]
  ).then((r) => r.rows[0]);

  if (!session) return NextResponse.json(null);

  return NextResponse.json({
    ...session,
    enteredAt: new Date(session.enteredAt).toISOString(),
    paidAt: session.paidAt ? new Date(session.paidAt).toISOString() : null,
    exitedAt: session.exitedAt ? new Date(session.exitedAt).toISOString() : null,
    createdAt: new Date(session.createdAt).toISOString(),
    updatedAt: new Date(session.updatedAt).toISOString(),
    currentPriceCents: session.status === "PAID" ? session.priceCents : calculatePriceCents(session.enteredAt),
    vehicle: { ...session.vehicle, createdAt: new Date(session.vehicle.createdAt).toISOString() },
    spot: session.spot
      ? {
          ...session.spot,
          lastSensorAt: session.spot.lastSensorAt ? new Date(session.spot.lastSensorAt).toISOString() : null,
          createdAt: new Date(session.spot.createdAt).toISOString(),
          updatedAt: new Date(session.spot.updatedAt).toISOString()
        }
      : null
  });
}
