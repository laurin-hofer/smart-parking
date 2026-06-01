import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been replaced. Use POST /api/hardware/sensor" },
    { status: 410 }
  );
}
