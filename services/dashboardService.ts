import { query } from "@/lib/db";
import { calculatePriceCents } from "@/lib/pricing";
import { listParkingSpotsWithOccupancy } from "@/services/parkingSpotService";

function parsePayload(payload: string) {
  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return { raw: payload };
  }
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function iso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

async function getSystemState() {
  const result = await query(
    `INSERT INTO "system_state" ("id")
     VALUES ('singleton')
     ON CONFLICT ("id") DO UPDATE SET "id" = EXCLUDED."id"
     RETURNING *`
  );
  return result.rows[0];
}

export async function getDashboardData() {
  const [systemState, spots, vehicles, sessions, exitedToday, hardwareEvents, logs] = await Promise.all([
    getSystemState(),
    listParkingSpotsWithOccupancy(),
    query('SELECT * FROM "vehicles" ORDER BY "createdAt" DESC').then((r) => r.rows),
    query(
      `SELECT
         s.*,
         row_to_json(v.*) AS vehicle,
         CASE WHEN p."id" IS NULL THEN NULL ELSE row_to_json(p.*) END AS spot
       FROM "parking_sessions" s
       JOIN "vehicles" v ON v."id" = s."vehicleId"
       LEFT JOIN "parking_spots" p ON p."id" = s."spotId"
       WHERE s."status" = ANY($1)
       ORDER BY s."enteredAt" DESC`,
      [["ACTIVE", "PAID"]]
    ).then((r) => r.rows),
    query('SELECT * FROM "parking_sessions" WHERE "status" = $1 AND "exitedAt" >= $2', ["EXITED", startOfToday()]).then(
      (r) => r.rows
    ),
    query('SELECT * FROM "hardware_events" ORDER BY "createdAt" DESC LIMIT 50').then((r) => r.rows),
    query('SELECT * FROM "event_logs" ORDER BY "createdAt" DESC LIMIT 100').then((r) => r.rows)
  ]);

  const revenueTodayCents = exitedToday.reduce((sum, s) => sum + s.priceCents, 0);

  return {
    systemState: {
      entryLocked: systemState.entryLocked,
      entryLockedAt: systemState.entryLockedAt?.toISOString() ?? null,
      latestPendingPlate: systemState.latestPendingPlate
    },
    stats: {
      total: spots.length,
      free: spots.filter((s) => s.status === "FREE").length,
      occupied: spots.filter((s) => s.status === "OCCUPIED").length,
      reserved: spots.filter((s) => s.status === "RESERVED").length,
      sensorUnknown: spots.filter((s) => s.status === "SENSOR_UNKNOWN").length,
      activeSessions: sessions.filter((s) => s.status === "ACTIVE").length,
      paidSessions: sessions.filter((s) => s.status === "PAID").length,
      revenueTodayCents,
      registeredVehicles: vehicles.length
    },
    spots,
    sessions: sessions.map((s) => ({
      ...s,
      enteredAt: iso(s.enteredAt),
      paidAt: iso(s.paidAt),
      exitedAt: iso(s.exitedAt),
      createdAt: iso(s.createdAt),
      updatedAt: iso(s.updatedAt),
      currentPriceCents: s.status === "PAID" ? s.priceCents : calculatePriceCents(s.enteredAt),
      vehicle: {
        ...s.vehicle,
        createdAt: iso(s.vehicle.createdAt)
      },
      spot: s.spot
        ? {
            ...s.spot,
            lastSensorAt: iso(s.spot.lastSensorAt),
            createdAt: iso(s.spot.createdAt),
            updatedAt: iso(s.spot.updatedAt)
          }
        : null
    })),
    vehicles: vehicles.map((v) => ({ ...v, createdAt: iso(v.createdAt) })),
    hardwareEvents: hardwareEvents.map((e) => ({
      ...e,
      payload: parsePayload(e.payload),
      createdAt: iso(e.createdAt)
    })),
    logs: logs.map((l) => ({ ...l, createdAt: iso(l.createdAt) }))
  };
}
