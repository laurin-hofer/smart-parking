import { NextResponse } from "next/server";
import { listParkingSpotsWithOccupancy } from "@/services/parkingSpotService";

export async function GET() {
  return NextResponse.json(await listParkingSpotsWithOccupancy());
}
