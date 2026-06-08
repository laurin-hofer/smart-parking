import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { calculatePriceCents, formatCents } from "@/lib/pricing";
import { logEvent } from "@/services/logService";

const PENALTY_CENTS = 12_000;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(
    await query(
      `SELECT
         s.*,
         row_to_json(v.*) AS vehicle,
         CASE WHEN p."id" IS NULL THEN NULL ELSE row_to_json(p.*) END AS spot
       FROM "parking_sessions" s
       JOIN "vehicles" v ON v."id" = s."vehicleId"
       LEFT JOIN "parking_spots" p ON p."id" = s."spotId"
       WHERE s."id" = $1`,
      [id]
    ).then((r) => r.rows[0] ?? null)
  );
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { forceExit?: boolean; penalty?: boolean };

  if (body.penalty) {
    const session = await query(
      `SELECT
         s.*,
         row_to_json(v.*) AS vehicle,
         CASE WHEN p."id" IS NULL THEN NULL ELSE row_to_json(p.*) END AS spot
       FROM "parking_sessions" s
       JOIN "vehicles" v ON v."id" = s."vehicleId"
       LEFT JOIN "parking_spots" p ON p."id" = s."spotId"
       WHERE s."id" = $1`,
      [id]
    ).then((r) => r.rows[0]);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.status !== "EXITED") {
      return NextResponse.json({ error: "Penalty can only be applied after exit" }, { status: 409 });
    }
    if (session.exitAllowed || session.paidAt) {
      return NextResponse.json({ error: "Session is already paid or cleared" }, { status: 409 });
    }

    const updated = await query(
      `UPDATE "parking_sessions"
       SET "paidAt" = NOW(),
           "priceCents" = $2,
           "exitAllowed" = TRUE,
           "paymentMethod" = 'penalty',
           "updatedAt" = NOW()
       WHERE "id" = $1
       RETURNING *`,
      [id, PENALTY_CENTS]
    ).then((r) => r.rows[0]);

    await logEvent({
      type: "penalty_paid",
      message: `${session.vehicle.licensePlate} was charged a ${formatCents(PENALTY_CENTS)} penalty for leaving without payment.`,
      licensePlate: session.vehicle.licensePlate,
      spotCode: session.spot?.code
    });

    return NextResponse.json({
      ...updated,
      vehicle: session.vehicle,
      spot: session.spot
    });
  }

  if (body.forceExit) {
    const session = await query(
      `SELECT
         s.*,
         row_to_json(v.*) AS vehicle,
         CASE WHEN p."id" IS NULL THEN NULL ELSE row_to_json(p.*) END AS spot
       FROM "parking_sessions" s
       JOIN "vehicles" v ON v."id" = s."vehicleId"
       LEFT JOIN "parking_spots" p ON p."id" = s."spotId"
       WHERE s."id" = $1`,
      [id]
    ).then((r) => r.rows[0]);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const priceCents = session.status === "PAID" ? session.priceCents : calculatePriceCents(session.enteredAt);

    const updated = await transaction(async (client) => {
      if (session.spotId) {
        await client.query('UPDATE "parking_spots" SET "status" = $2, "updatedAt" = NOW() WHERE "id" = $1', [
          session.spotId,
          "FREE"
        ]);
      }
      await client.query(
        `UPDATE "parking_sessions"
         SET "status" = 'EXITED',
             "exitedAt" = NOW(),
             "priceCents" = $2,
             "exitAllowed" = TRUE,
             "updatedAt" = NOW()
         WHERE "id" = $1`,
        [id, priceCents]
      );
      return {
        ...session,
        status: "EXITED",
        exitedAt: new Date(),
        priceCents,
        exitAllowed: true
      };
    });

    await logEvent({
      type: "admin_force_exit",
      message: `${session.vehicle.licensePlate} force-exited by admin.`,
      licensePlate: session.vehicle.licensePlate,
      spotCode: session.spot?.code
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ ok: true });
}
