import { NextResponse } from "next/server";
import { transaction } from "@/lib/db";
import { logEvent } from "@/services/logService";

export async function POST() {
  await transaction(async (client) => {
    await client.query(
      `UPDATE "parking_sessions"
       SET "status" = 'EXITED',
           "exitedAt" = NOW(),
           "updatedAt" = NOW()
       WHERE "status" = ANY($1)`,
      [["ACTIVE", "PAID"]]
    );
    await client.query('UPDATE "parking_spots" SET "status" = $1, "updatedAt" = NOW()', ["FREE"]);
    await client.query(
      `UPDATE "pending_entries"
       SET "status" = 'CANCELLED',
           "updatedAt" = NOW()
       WHERE "status" = 'PENDING'`
    );
    await client.query(
      `INSERT INTO "system_state" ("id", "entryLocked", "entryLockedAt", "latestPendingPlate")
       VALUES ('singleton', FALSE, NULL, NULL)
       ON CONFLICT ("id") DO UPDATE
       SET "entryLocked" = FALSE,
           "entryLockedAt" = NULL,
           "latestPendingPlate" = NULL,
           "updatedAt" = NOW()`
    );
  });

  await logEvent({ type: "admin_action", message: "Demo reset: all sessions closed, all spots freed." });

  return NextResponse.json({ ok: true, message: "Demo reset complete" });
}
