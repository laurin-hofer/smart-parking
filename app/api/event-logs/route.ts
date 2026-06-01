import { NextRequest, NextResponse } from "next/server";
import { query as queryDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  const type = request.nextUrl.searchParams.get("type");

  const filters = [];
  const params: string[] = [];

  if (type) {
    params.push(type);
    filters.push(`"type" = $${params.length}`);
  }
  if (query) {
    params.push(`%${query}%`);
    filters.push(`("message" ILIKE $${params.length} OR "licensePlate" ILIKE $${params.length} OR "spotCode" ILIKE $${params.length})`);
  }

  const sql = `SELECT * FROM "event_logs" ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""} ORDER BY "createdAt" DESC LIMIT 150`;
  return NextResponse.json(await queryDb(sql, params).then((r) => r.rows));
}
