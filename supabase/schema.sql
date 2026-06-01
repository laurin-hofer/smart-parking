-- Smart Parking System schema for Supabase/PostgreSQL.
-- The app creates this schema automatically on first database access.
-- You can also run it manually in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS "vehicles" (
    "id" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL DEFAULT 'Guest',
    "note" TEXT,
    "isAllowed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "parking_spots" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FREE',
    "sensorId" TEXT,
    "lastSensorAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "parking_spots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "parking_sessions" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "spotId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enteredAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMPTZ,
    "exitedAt" TIMESTAMPTZ,
    "exitAllowed" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "parking_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pending_entries" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sessionId" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "pending_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "hardware_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hardware_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "system_state" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "entryLocked" BOOLEAN NOT NULL DEFAULT false,
    "entryLockedAt" TIMESTAMPTZ,
    "latestPendingPlate" TEXT,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "system_state_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "event_logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "licensePlate" TEXT,
    "spotCode" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "vehicles_licensePlate_key" ON "vehicles"("licensePlate");
CREATE INDEX IF NOT EXISTS "vehicles_licensePlate_idx" ON "vehicles"("licensePlate");
CREATE UNIQUE INDEX IF NOT EXISTS "parking_spots_code_key" ON "parking_spots"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "parking_spots_sensorId_key" ON "parking_spots"("sensorId");
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parking_sessions_vehicleId_fkey'
  ) THEN
    ALTER TABLE "parking_sessions"
      ADD CONSTRAINT "parking_sessions_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parking_sessions_spotId_fkey'
  ) THEN
    ALTER TABLE "parking_sessions"
      ADD CONSTRAINT "parking_sessions_spotId_fkey"
      FOREIGN KEY ("spotId") REFERENCES "parking_spots"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pending_entries_vehicleId_fkey'
  ) THEN
    ALTER TABLE "pending_entries"
      ADD CONSTRAINT "pending_entries_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pending_entries_sessionId_fkey'
  ) THEN
    ALTER TABLE "pending_entries"
      ADD CONSTRAINT "pending_entries_sessionId_fkey"
      FOREIGN KEY ("sessionId") REFERENCES "parking_sessions"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
