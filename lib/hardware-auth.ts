import { NextRequest, NextResponse } from "next/server";

export function validateHardwareKey(request: NextRequest): boolean {
  const apiKey = process.env.HARDWARE_API_KEY;
  if (!apiKey) return false;
  return request.headers.get("x-hardware-key") === apiKey;
}

export function hardwareUnauthorized() {
  return NextResponse.json({ error: "Invalid hardware API key" }, { status: 401 });
}
