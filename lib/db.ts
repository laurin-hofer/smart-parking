import { randomUUID } from "crypto";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var parkingPgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var parkingDbReady: Promise<void> | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required. Set it to your Supabase PostgreSQL connection string.");
}

const shouldUseSsl = connectionString.includes("supabase.co") || connectionString.includes("pooler.supabase.com");

export const db =
  globalThis.parkingPgPool ??
  new Pool({
    connectionString,
    max: 10,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.parkingPgPool = db;
}

export function createId() {
  return randomUUID();
}

async function runBootstrap(client: Pool | PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "vehicles" (
      "id" TEXT PRIMARY KEY,
      "licensePlate" TEXT NOT NULL UNIQUE,
      "ownerName" TEXT NOT NULL DEFAULT 'Guest',
      "note" TEXT,
      "isAllowed" BOOLEAN NOT NULL DEFAULT TRUE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "parking_spots" (
      "id" TEXT PRIMARY KEY,
      "code" TEXT NOT NULL UNIQUE,
      "status" TEXT NOT NULL DEFAULT 'FREE',
      "sensorId" TEXT UNIQUE,
      "lastSensorAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "parking_sessions" (
      "id" TEXT PRIMARY KEY,
      "vehicleId" TEXT NOT NULL REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      "spotId" TEXT REFERENCES "parking_spots"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "enteredAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "paidAt" TIMESTAMPTZ,
      "exitedAt" TIMESTAMPTZ,
      "exitAllowed" BOOLEAN NOT NULL DEFAULT FALSE,
      "paymentMethod" TEXT,
      "priceCents" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "pending_entries" (
      "id" TEXT PRIMARY KEY,
      "vehicleId" TEXT NOT NULL REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      "licensePlate" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "sessionId" TEXT REFERENCES "parking_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      "source" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "hardware_events" (
      "id" TEXT PRIMARY KEY,
      "type" TEXT NOT NULL,
      "payload" TEXT NOT NULL,
      "source" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "system_state" (
      "id" TEXT PRIMARY KEY DEFAULT 'singleton',
      "entryLocked" BOOLEAN NOT NULL DEFAULT FALSE,
      "entryLockedAt" TIMESTAMPTZ,
      "latestPendingPlate" TEXT,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "event_logs" (
      "id" TEXT PRIMARY KEY,
      "type" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "licensePlate" TEXT,
      "spotCode" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS "vehicles_licensePlate_idx" ON "vehicles"("licensePlate");
    CREATE INDEX IF NOT EXISTS "parking_spots_status_idx" ON "parking_spots"("status");
    CREATE INDEX IF NOT EXISTS "parking_sessions_status_idx" ON "parking_sessions"("status");
    CREATE INDEX IF NOT EXISTS "parking_sessions_enteredAt_idx" ON "parking_sessions"("enteredAt");
    CREATE UNIQUE INDEX IF NOT EXISTS "parking_sessions_active_vehicle_key"
      ON "parking_sessions"("vehicleId")
      WHERE "status" IN ('ACTIVE', 'PAID');
    CREATE UNIQUE INDEX IF NOT EXISTS "parking_sessions_active_spot_key"
      ON "parking_sessions"("spotId")
      WHERE "spotId" IS NOT NULL AND "status" IN ('ACTIVE', 'PAID');
    CREATE INDEX IF NOT EXISTS "pending_entries_status_createdAt_idx" ON "pending_entries"("status", "createdAt");
    CREATE UNIQUE INDEX IF NOT EXISTS "pending_entries_active_vehicle_key"
      ON "pending_entries"("vehicleId")
      WHERE "status" = 'PENDING';
    CREATE INDEX IF NOT EXISTS "hardware_events_type_idx" ON "hardware_events"("type");
    CREATE INDEX IF NOT EXISTS "hardware_events_createdAt_idx" ON "hardware_events"("createdAt");
    CREATE INDEX IF NOT EXISTS "event_logs_type_idx" ON "event_logs"("type");
    CREATE INDEX IF NOT EXISTS "event_logs_createdAt_idx" ON "event_logs"("createdAt");

    INSERT INTO "system_state" ("id")
    VALUES ('singleton')
    ON CONFLICT ("id") DO NOTHING;
  `);

  const spotCount = await client.query<{ count: string }>('SELECT COUNT(*) AS count FROM "parking_spots"');
  if (Number(spotCount.rows[0]?.count ?? 0) === 0) {
    for (let index = 1; index <= 8; index += 1) {
      await client.query(
        `INSERT INTO "parking_spots" ("id", "code", "sensorId")
         VALUES ($1, $2, $3)
         ON CONFLICT ("code") DO NOTHING`,
        [createId(), `A-${index}`, `sensor_a_${index}`]
      );
    }
  }
}

export async function ensureDatabase() {
  globalThis.parkingDbReady ??= runBootstrap(db);
  return globalThis.parkingDbReady;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  await ensureDatabase();
  return db.query<T>(text, params);
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>) {
  await ensureDatabase();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
