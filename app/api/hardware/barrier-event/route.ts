import { NextRequest, NextResponse } from "next/server";
import { logEvent } from "@/services/logService";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { type: string; message: string; licensePlate?: string; parkingSpotName?: string };
  return NextResponse.json(await logEvent(body));
}
