import { createId, query } from "@/lib/db";

type LogParams = {
  type: string;
  message: string;
  licensePlate?: string | null;
  spotCode?: string | null;
};

export async function logEvent(params: LogParams) {
  const result = await query(
    `INSERT INTO "event_logs" ("id", "type", "message", "licensePlate", "spotCode")
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [createId(), params.type, params.message, params.licensePlate ?? null, params.spotCode ?? null]
  );
  return result.rows[0];
}
