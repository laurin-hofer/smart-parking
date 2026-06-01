import { NextRequest, NextResponse } from "next/server";
import { validateHardwareKey, hardwareUnauthorized } from "@/lib/hardware-auth";
import { startEntry } from "@/services/hardwareService";

export async function POST(request: NextRequest) {
  if (!validateHardwareKey(request)) return hardwareUnauthorized();

  const body = (await request.json().catch(() => ({}))) as { plate?: string };
  const source = request.headers.get("x-forwarded-for") ?? undefined;

  const result = await startEntry(body.plate, source);
  return NextResponse.json(result, { status: result.gateOpen ? 200 : 423 });
}
