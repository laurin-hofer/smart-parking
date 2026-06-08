import type { PoolClient } from "pg";
import { createId, query, transaction } from "@/lib/db";
import { calculatePriceCents, formatCents } from "@/lib/pricing";
import { normalizePlate } from "@/lib/utils";
import { logEvent } from "@/services/logService";

async function getOrCreateSystemState() {
  const result = await query(
    `INSERT INTO "system_state" ("id")
     VALUES ('singleton')
     ON CONFLICT ("id") DO UPDATE SET "id" = EXCLUDED."id"
     RETURNING *`
  );
  return result.rows[0];
}

async function logHardwareEvent(type: string, payload: unknown, source?: string) {
  const result = await query(
    `INSERT INTO "hardware_events" ("id", "type", "payload", "source")
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [createId(), type, JSON.stringify(payload), source ?? null]
  );
  return result.rows[0];
}

async function sessionWithRelations(client: PoolClient, sessionId: string) {
  const result = await client.query(
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
  return result.rows[0];
}

async function getOrCreateVehicle(client: PoolClient, normalizedPlate: string) {
  let vehicle = (await client.query('SELECT * FROM "vehicles" WHERE "licensePlate" = $1', [normalizedPlate])).rows[0];

  if (!vehicle) {
    vehicle = (
      await client.query(
        `INSERT INTO "vehicles" ("id", "licensePlate", "ownerName", "isAllowed")
         VALUES ($1, $2, 'Guest', TRUE)
         RETURNING *`,
        [createId(), normalizedPlate]
      )
    ).rows[0];
  }

  return vehicle;
}

async function refreshLatestPendingPlate(client: PoolClient) {
  const nextPending = (
    await client.query(
      `SELECT "licensePlate"
       FROM "pending_entries"
       WHERE "status" = 'PENDING'
       ORDER BY "createdAt" ASC
       LIMIT 1`
    )
  ).rows[0];

  await client.query(
    `UPDATE "system_state"
     SET "latestPendingPlate" = $1,
         "updatedAt" = NOW()
     WHERE "id" = 'singleton'`,
    [nextPending?.licensePlate ?? null]
  );
}

export async function plateDetected(plate: string, source?: string) {
  const normalized = normalizePlate(plate);

  const result = await transaction(async (client) => {
    const vehicle = await getOrCreateVehicle(client, normalized);

    if (!vehicle.isAllowed) {
      return { success: false, reason: "Vehicle access has been disabled", vehicle };
    }

    const activeSession = (
      await client.query(
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
      )
    ).rows[0];

    if (activeSession) {
      return { success: false, reason: "Vehicle already has an active parking session", session: activeSession };
    }

    const existingPending = (
      await client.query(
        `SELECT *
         FROM "pending_entries"
         WHERE "vehicleId" = $1 AND "status" = 'PENDING'
         ORDER BY "createdAt" ASC
         LIMIT 1`,
        [vehicle.id]
      )
    ).rows[0];

    if (existingPending) {
      return { success: true, pendingEntry: existingPending, duplicate: true };
    }

    const pendingEntry = (
      await client.query(
        `INSERT INTO "pending_entries" ("id", "vehicleId", "licensePlate", "source", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [createId(), vehicle.id, normalized, source ?? null]
      )
    ).rows[0];

    await refreshLatestPendingPlate(client);
    return { success: true, pendingEntry, duplicate: false };
  });

  await logHardwareEvent("plate_detected", { plate: normalized, duplicate: result.duplicate ?? false }, source);

  if (!result.success) {
    await logEvent({
      type: "entry_denied",
      message: `${normalized} denied - ${result.reason}.`,
      licensePlate: normalized
    });
    return result;
  }

  if (!result.duplicate) {
    await logEvent({
      type: "plate_detected",
      message: `${normalized} is waiting for a parking spot sensor.`,
      licensePlate: normalized
    });
  }

  return result;
}

export async function startEntry(plate?: string, source?: string) {
  const state = await getOrCreateSystemState();

  if (state.entryLocked) {
    return {
      gateOpen: false,
      reason: "Entry is currently locked - another vehicle is entering",
      entryLocked: true
    };
  }

  const normalized = plate ? normalizePlate(plate) : null;
  if (normalized) {
    const pendingResult = await plateDetected(normalized, source);
    if (!pendingResult.success) {
      return {
        gateOpen: false,
        reason: pendingResult.reason,
        entryLocked: false
      };
    }
  }

  await query(
    `UPDATE "system_state"
     SET "entryLocked" = TRUE,
         "entryLockedAt" = NOW(),
         "latestPendingPlate" = $1,
         "updatedAt" = NOW()
     WHERE "id" = 'singleton'`,
    [normalized]
  );

  await logHardwareEvent("entry_start", { plate: normalized }, source);
  await logEvent({
    type: "entry_start",
    message: normalized
      ? `Entry started for ${normalized}. Barrier open, OCR in progress.`
      : "Entry started. Barrier open, waiting for OCR.",
    licensePlate: normalized
  });

  return { gateOpen: true, latestPendingPlate: normalized };
}

export async function completeEntry(plate: string, spotCode: string, source?: string) {
  const normalized = normalizePlate(plate);

  const result = await transaction(async (client) => {
    const vehicle = await getOrCreateVehicle(client, normalized);

    if (!vehicle.isAllowed) {
      return { success: false, reason: "Vehicle access has been disabled", vehicle };
    }

    const existingSession = (
      await client.query(
        `SELECT *
         FROM "parking_sessions"
         WHERE ("vehicleId" = $1 OR "spotId" = (SELECT "id" FROM "parking_spots" WHERE "code" = $2))
           AND "status" = ANY($3)
         LIMIT 1`,
        [vehicle.id, spotCode, ["ACTIVE", "PAID"]]
      )
    ).rows[0];

    if (existingSession) {
      return { success: false, reason: "Vehicle or parking spot already has an active parking session" };
    }

    const spot = (await client.query('SELECT * FROM "parking_spots" WHERE "code" = $1', [spotCode])).rows[0];
    if (!spot) throw new Error(`Parking spot ${spotCode} not found`);

    const session = (
      await client.query(
        `INSERT INTO "parking_sessions" ("id", "vehicleId", "spotId", "status")
         VALUES ($1, $2, $3, 'ACTIVE')
         RETURNING *`,
        [createId(), vehicle.id, spot.id]
      )
    ).rows[0];

    await client.query('UPDATE "parking_spots" SET "status" = $2, "updatedAt" = NOW() WHERE "id" = $1', [
      spot.id,
      "OCCUPIED"
    ]);
    await client.query(
      `UPDATE "system_state"
       SET "entryLocked" = FALSE,
           "entryLockedAt" = NULL,
           "updatedAt" = NOW()
       WHERE "id" = 'singleton'`
    );
    await client.query(
      `UPDATE "pending_entries"
       SET "status" = 'ASSIGNED',
           "sessionId" = $2,
           "updatedAt" = NOW()
       WHERE "vehicleId" = $1 AND "status" = 'PENDING'`,
      [vehicle.id, session.id]
    );
    await refreshLatestPendingPlate(client);

    return { success: true, session: await sessionWithRelations(client, session.id) };
  });

  if (!result.success) {
    await logEvent({
      type: "entry_denied",
      message: `${normalized} denied - vehicle access disabled by admin.`,
      licensePlate: normalized
    });
    return result;
  }

  await logHardwareEvent("entry_complete", { plate: normalized, spotCode }, source);
  await logEvent({
    type: "car_entered",
    message: `${normalized} entered and parked at ${spotCode}.`,
    licensePlate: normalized,
    spotCode
  });

  return { success: true, session: result.session };
}

export async function updateSensor(spotCode: string, occupied: boolean, sensorId?: string, source?: string) {
  const result = await transaction(async (client) => {
    const spot = (
      await client.query(
        sensorId
          ? 'SELECT * FROM "parking_spots" WHERE "sensorId" = $1 FOR UPDATE'
          : 'SELECT * FROM "parking_spots" WHERE "code" = $1 FOR UPDATE',
        [sensorId ?? spotCode]
      )
    ).rows[0];
    if (!spot) throw new Error(`Spot not found: ${spotCode || sensorId}`);

    const wasOccupied = spot.status === "OCCUPIED";
    const newStatus = occupied ? "OCCUPIED" : "FREE";

    await client.query(
      `UPDATE "parking_spots"
       SET "status" = $2,
           "lastSensorAt" = NOW(),
           "updatedAt" = NOW()
       WHERE "id" = $1`,
      [spot.id, newStatus]
    );

    if (!wasOccupied && occupied) {
      const existingSpotSession = (
        await client.query(
          `SELECT "id"
           FROM "parking_sessions"
           WHERE "spotId" = $1 AND "status" = ANY($2)
           LIMIT 1`,
          [spot.id, ["ACTIVE", "PAID"]]
        )
      ).rows[0];

      if (existingSpotSession) {
        return { spotCode: spot.code, status: newStatus, action: "spot_already_assigned" as const };
      }

      const pending = (
        await client.query(
          `SELECT pe.*, v."isAllowed"
           FROM "pending_entries" pe
           JOIN "vehicles" v ON v."id" = pe."vehicleId"
           WHERE pe."status" = 'PENDING'
           ORDER BY pe."createdAt" ASC
           LIMIT 1
           FOR UPDATE OF pe SKIP LOCKED`
        )
      ).rows[0];

      if (!pending) {
        return { spotCode: spot.code, status: newStatus, action: "occupied_without_pending_plate" as const };
      }

      if (!pending.isAllowed) {
        await client.query(
          `UPDATE "pending_entries"
           SET "status" = 'CANCELLED',
               "updatedAt" = NOW()
           WHERE "id" = $1`,
          [pending.id]
        );
        await refreshLatestPendingPlate(client);
        return { spotCode: spot.code, status: newStatus, action: "pending_vehicle_denied" as const, plate: pending.licensePlate };
      }

      const vehicleSession = (
        await client.query(
          `SELECT "id"
           FROM "parking_sessions"
           WHERE "vehicleId" = $1 AND "status" = ANY($2)
           LIMIT 1`,
          [pending.vehicleId, ["ACTIVE", "PAID"]]
        )
      ).rows[0];

      if (vehicleSession) {
        await client.query(
          `UPDATE "pending_entries"
           SET "status" = 'CANCELLED',
               "updatedAt" = NOW()
           WHERE "id" = $1`,
          [pending.id]
        );
        await refreshLatestPendingPlate(client);
        return { spotCode: spot.code, status: newStatus, action: "vehicle_already_parked" as const, plate: pending.licensePlate };
      }

      const session = (
        await client.query(
          `INSERT INTO "parking_sessions" ("id", "vehicleId", "spotId", "status", "enteredAt")
           VALUES ($1, $2, $3, 'ACTIVE', $4)
           RETURNING *`,
          [createId(), pending.vehicleId, spot.id, pending.createdAt]
        )
      ).rows[0];

      await client.query(
        `UPDATE "pending_entries"
         SET "status" = 'ASSIGNED',
             "sessionId" = $2,
             "updatedAt" = NOW()
         WHERE "id" = $1`,
        [pending.id, session.id]
      );
      await refreshLatestPendingPlate(client);

      return {
        spotCode: spot.code,
        status: newStatus,
        action: "session_started" as const,
        plate: pending.licensePlate,
        session: await sessionWithRelations(client, session.id)
      };
    }

    if (wasOccupied && !occupied) {
      const session = (
        await client.query(
          `SELECT s.*, v."licensePlate"
           FROM "parking_sessions" s
           JOIN "vehicles" v ON v."id" = s."vehicleId"
           WHERE s."spotId" = $1 AND s."status" = ANY($2)
           ORDER BY s."enteredAt" DESC
           LIMIT 1
           FOR UPDATE OF s`,
          [spot.id, ["ACTIVE", "PAID"]]
        )
      ).rows[0];

      if (!session) {
        return { spotCode: spot.code, status: newStatus, action: "freed_without_active_session" as const };
      }

      const priceCents = session.priceCents || calculatePriceCents(session.enteredAt);
      await client.query(
        `UPDATE "parking_sessions"
         SET "status" = 'EXITED',
             "exitedAt" = NOW(),
             "priceCents" = $2,
             "updatedAt" = NOW()
         WHERE "id" = $1`,
        [session.id, priceCents]
      );

      return {
        spotCode: spot.code,
        status: newStatus,
        action: "session_finished" as const,
        plate: session.licensePlate,
        priceCents,
        wasPaid: session.status === "PAID" || session.exitAllowed
      };
    }

    return { spotCode: spot.code, status: newStatus, action: "sensor_state_recorded" as const };
  });

  await logHardwareEvent("sensor_update", { spotCode: result.spotCode, occupied, sensorId, action: result.action }, source);

  if (result.action === "session_started") {
    await logEvent({
      type: "car_entered",
      message: `${result.plate} entered and parked at ${result.spotCode}.`,
      licensePlate: result.plate,
      spotCode: result.spotCode
    });
  }

  if (result.action === "session_finished") {
    await logEvent({
      type: "car_exited",
      message: `${result.plate} left ${result.spotCode}. ${result.wasPaid ? "Payment was confirmed." : "Payment was not confirmed."}`,
      licensePlate: result.plate,
      spotCode: result.spotCode
    });
  }

  if (result.action === "occupied_without_pending_plate") {
    await logEvent({
      type: "sensor_warning",
      message: `${result.spotCode} became occupied but no pending license plate was available.`,
      spotCode: result.spotCode
    });
  }

  return result;
}

export async function checkExit(plate: string, source?: string) {
  const normalized = normalizePlate(plate);

  const vehicle = (await query('SELECT * FROM "vehicles" WHERE "licensePlate" = $1', [normalized])).rows[0];
  if (!vehicle) {
    return { gateOpen: false, reason: "No vehicle record found for this plate" };
  }

  const session = (
    await query(
      `SELECT
         s.*,
         CASE WHEN p."id" IS NULL THEN NULL ELSE row_to_json(p.*) END AS spot
       FROM "parking_sessions" s
       LEFT JOIN "parking_spots" p ON p."id" = s."spotId"
       WHERE s."vehicleId" = $1 AND s."status" = ANY($2)
       ORDER BY s."enteredAt" DESC
       LIMIT 1`,
      [vehicle.id, ["ACTIVE", "PAID"]]
    )
  ).rows[0];

  if (!session) {
    return { gateOpen: false, reason: "No active parking session found" };
  }

  if (session.status === "ACTIVE" && !session.exitAllowed) {
    await logHardwareEvent("exit_denied", { plate: normalized, reason: "payment_required" }, source);
    await logEvent({
      type: "exit_denied",
      message: `${normalized} tried to exit without paying.`,
      licensePlate: normalized,
      spotCode: session.spot?.code
    });
    return {
      gateOpen: false,
      reason: "Payment required before exit",
      sessionId: session.id,
      priceCents: calculatePriceCents(session.enteredAt)
    };
  }

  await logHardwareEvent("exit_granted", { plate: normalized }, source);
  await logEvent({
    type: "exit_granted",
    message: `${normalized} may exit${session.spot ? ` from ${session.spot.code}` : ""}. Paid ${formatCents(session.priceCents)}.`,
    licensePlate: normalized,
    spotCode: session.spot?.code
  });

  return { gateOpen: true, reason: "Payment confirmed", priceCents: session.priceCents };
}
