import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { completeEntry, checkExit } from "@/services/hardwareService";

const DEMO_PLATES = ["W-123AB", "I-404CD", "KU-77EF", "SZ-808GP", "BM-999XX", "LZ-1337A"];

export async function POST() {
  const activeSessions = await query(
    `SELECT s.*, row_to_json(v.*) AS vehicle
     FROM "parking_sessions" s
     JOIN "vehicles" v ON v."id" = s."vehicleId"
     WHERE s."status" = ANY($1)`,
    [["ACTIVE", "PAID"]]
  ).then((r) => r.rows);

  if (activeSessions.length >= 2 && Math.random() > 0.4) {
    const session = activeSessions[Math.floor(Math.random() * activeSessions.length)];
    if (session.status === "PAID") {
      return NextResponse.json(await checkExit(session.vehicle.licensePlate, "simulation"));
    }
    return NextResponse.json({ simulated: "exit_skipped_not_paid", plate: session.vehicle.licensePlate });
  }

  const freeSpot = await query(
    'SELECT * FROM "parking_spots" WHERE "status" = $1 ORDER BY "code" ASC LIMIT 1',
    ["FREE"]
  ).then((r) => r.rows[0]);
  if (!freeSpot) {
    return NextResponse.json({ simulated: "no_free_spot" });
  }

  const plate = DEMO_PLATES[Math.floor(Math.random() * DEMO_PLATES.length)];
  return NextResponse.json(await completeEntry(plate, freeSpot.code, "simulation"));
}
