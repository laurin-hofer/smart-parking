const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");

const db = new DatabaseSync(path.join(__dirname, "..", "legacy", "dev.db"));

const dateColumns = new Set(["createdAt", "updatedAt", "lastSensorAt", "enteredAt", "paidAt", "exitedAt", "entryLockedAt"]);
const booleanColumns = new Set(["isAllowed", "exitAllowed", "entryLocked"]);

function sqlValue(value, column) {
  if (value === null || value === undefined) return "NULL";
  if (dateColumns.has(column)) {
    if (typeof value === "number") return `to_timestamp(${value} / 1000.0)`;
    return `'${String(value).replace(/'/g, "''")}'`;
  }
  if (booleanColumns.has(column)) return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function insert(table, rows, columns) {
  if (!rows.length) return "";
  const values = rows
    .map((row) => `(${columns.map((column) => sqlValue(row[column], column)).join(", ")})`)
    .join(",\n");
  return `INSERT INTO "${table}" (${columns.map((column) => `"${column}"`).join(", ")}) VALUES\n${values};`;
}

function rows(query) {
  return db.prepare(query).all();
}

function main() {
  const vehicles = rows('SELECT * FROM "vehicles" ORDER BY "createdAt" ASC');
  const parkingSpots = rows('SELECT * FROM "parking_spots" ORDER BY "code" ASC');
  const systemState = rows('SELECT * FROM "system_state"');
  const parkingSessions = rows('SELECT * FROM "parking_sessions" ORDER BY "createdAt" ASC');
  const hardwareEvents = rows('SELECT * FROM "hardware_events" ORDER BY "createdAt" ASC');
  const eventLogs = rows('SELECT * FROM "event_logs" ORDER BY "createdAt" ASC');

  const statements = [
    "BEGIN;",
    'DELETE FROM "event_logs";',
    'DELETE FROM "hardware_events";',
    'DELETE FROM "parking_sessions";',
    'DELETE FROM "parking_spots";',
    'DELETE FROM "vehicles";',
    'DELETE FROM "system_state";',
    insert("vehicles", vehicles, ["id", "licensePlate", "ownerName", "note", "isAllowed", "createdAt"]),
    insert("parking_spots", parkingSpots, ["id", "code", "status", "sensorId", "lastSensorAt", "createdAt", "updatedAt"]),
    insert("system_state", systemState, ["id", "entryLocked", "entryLockedAt", "latestPendingPlate", "updatedAt"]),
    insert("parking_sessions", parkingSessions, [
      "id",
      "vehicleId",
      "spotId",
      "status",
      "enteredAt",
      "paidAt",
      "exitedAt",
      "exitAllowed",
      "paymentMethod",
      "priceCents",
      "createdAt",
      "updatedAt"
    ]),
    insert("hardware_events", hardwareEvents, ["id", "type", "payload", "source", "createdAt"]),
    insert("event_logs", eventLogs, ["id", "type", "message", "licensePlate", "spotCode", "createdAt"]),
    "COMMIT;"
  ].filter(Boolean);

  process.stdout.write(`${statements.join("\n\n")}\n`);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  db.close();
}
