import { NextRequest, NextResponse } from "next/server";
import { updateSpotByName, type SpotStatus } from "@/services/sensorService";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { parkingSpotName: string; status: SpotStatus };
  return NextResponse.json(await updateSpotByName(body.parkingSpotName, body.status));
}
