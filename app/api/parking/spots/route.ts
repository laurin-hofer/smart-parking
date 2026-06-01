import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const spots = await query('SELECT * FROM "parking_spots" ORDER BY "code" ASC').then((r) => r.rows);
  return NextResponse.json(spots);
}
