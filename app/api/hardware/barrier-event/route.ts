import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been removed. Use POST /api/hardware/entry/start, /entry/complete, or /exit/check" },
    { status: 410 }
  );
}
