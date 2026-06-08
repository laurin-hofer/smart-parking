import { query } from "@/lib/db";

export async function listParkingSpotsWithOccupancy() {
  return query(
    `SELECT
       p.*,
       active."sessionId" AS "activeSessionId",
       active."sessionStatus" AS "activeSessionStatus",
       active."licensePlate" AS "activeLicensePlate"
     FROM "parking_spots" p
     LEFT JOIN LATERAL (
       SELECT
         s."id" AS "sessionId",
         s."status" AS "sessionStatus",
         v."licensePlate"
       FROM "parking_sessions" s
       JOIN "vehicles" v ON v."id" = s."vehicleId"
       WHERE s."spotId" = p."id"
         AND s."status" = ANY($1)
       ORDER BY s."enteredAt" DESC
       LIMIT 1
     ) active ON TRUE
     ORDER BY p."code" ASC`,
    [["ACTIVE", "PAID"]]
  ).then((r) => r.rows);
}
