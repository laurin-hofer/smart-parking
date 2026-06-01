import { query } from "@/lib/db";
import { calculatePriceCents, formatCents } from "@/lib/pricing";
import { logEvent } from "@/services/logService";

export async function paySession(sessionId: string, paymentMethod = "card") {
  const sessionResult = await query(
    `SELECT
       s.*,
       row_to_json(v.*) AS vehicle,
       CASE WHEN p."id" IS NULL THEN NULL ELSE row_to_json(p.*) END AS spot
     FROM "parking_sessions" s
     JOIN "vehicles" v ON v."id" = s."vehicleId"
     LEFT JOIN "parking_spots" p ON p."id" = s."spotId"
     WHERE s."id" = $1`,
    [sessionId]
  );
  const session = sessionResult.rows[0];
  if (!session) throw new Error("Session not found");
  if (session.status === "EXITED") throw new Error("Session already ended");
  if (session.status === "PAID") throw new Error("Session already paid");

  const priceCents = calculatePriceCents(session.enteredAt);

  const paidResult = await query(
    `UPDATE "parking_sessions"
     SET "status" = 'PAID',
         "paidAt" = NOW(),
         "priceCents" = $2,
         "exitAllowed" = TRUE,
         "paymentMethod" = $3,
         "updatedAt" = NOW()
     WHERE "id" = $1
     RETURNING *`,
    [sessionId, priceCents, paymentMethod]
  );

  await logEvent({
    type: "payment_completed",
    message: `${session.vehicle.licensePlate} paid ${formatCents(priceCents)} via ${paymentMethod}.`,
    licensePlate: session.vehicle.licensePlate,
    spotCode: session.spot?.code
  });

  return {
    ...paidResult.rows[0],
    vehicle: session.vehicle,
    spot: session.spot
  };
}
