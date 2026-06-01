import { createId, query as queryDb } from "@/lib/db";
import { normalizePlate } from "@/lib/utils";
import { logEvent } from "@/services/logService";

export async function listVehicles(search?: string) {
  const searchQuery = search?.trim();
  if (!searchQuery) {
    const result = await queryDb('SELECT * FROM "vehicles" ORDER BY "createdAt" DESC');
    return result.rows;
  }

  const result = await queryDb(
    `SELECT * FROM "vehicles"
     WHERE "licensePlate" ILIKE $1 OR "ownerName" ILIKE $2 OR "note" ILIKE $2
     ORDER BY "createdAt" DESC`,
    [`%${normalizePlate(searchQuery)}%`, `%${searchQuery}%`]
  );
  return result.rows;
}

export async function createVehicle(data: {
  licensePlate: string;
  ownerName: string;
  note?: string;
  isAllowed?: boolean;
}) {
  const result = await queryDb(
    `INSERT INTO "vehicles" ("id", "licensePlate", "ownerName", "note", "isAllowed")
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [createId(), normalizePlate(data.licensePlate), data.ownerName.trim(), data.note?.trim() || null, data.isAllowed ?? true]
  );
  const vehicle = result.rows[0];
  await logEvent({
    type: "vehicle_registered",
    message: `${vehicle.licensePlate} was registered for ${vehicle.ownerName}.`,
    licensePlate: vehicle.licensePlate
  });
  return vehicle;
}

export async function updateVehicle(
  id: string,
  data: Partial<{ licensePlate: string; ownerName: string; note: string | null; isAllowed: boolean }>
) {
  const current = await queryDb('SELECT * FROM "vehicles" WHERE "id" = $1', [id]);
  if (!current.rows[0]) throw new Error("Vehicle not found");

  const result = await queryDb(
    `UPDATE "vehicles"
     SET "licensePlate" = $2,
         "ownerName" = $3,
         "note" = $4,
         "isAllowed" = $5
     WHERE "id" = $1
     RETURNING *`,
    [
      id,
      data.licensePlate ? normalizePlate(data.licensePlate) : current.rows[0].licensePlate,
      data.ownerName?.trim() ?? current.rows[0].ownerName,
      data.note === undefined ? current.rows[0].note : data.note?.trim() || null,
      data.isAllowed ?? current.rows[0].isAllowed
    ]
  );
  const vehicle = result.rows[0];
  await logEvent({
    type: "vehicle_updated",
    message: `${vehicle.licensePlate} was updated by admin.`,
    licensePlate: vehicle.licensePlate
  });
  return vehicle;
}

export async function deleteVehicle(id: string) {
  const result = await queryDb('DELETE FROM "vehicles" WHERE "id" = $1 RETURNING *', [id]);
  const vehicle = result.rows[0];
  if (!vehicle) throw new Error("Vehicle not found");
  await logEvent({
    type: "admin_manual_action",
    message: `${vehicle.licensePlate} was deleted from registered vehicles.`,
    licensePlate: vehicle.licensePlate
  });
  return vehicle;
}
