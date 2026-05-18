import { NextRequest, NextResponse } from "next/server";
import { handlePlateDetected } from "@/services/barrierService";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { licensePlate: string };
  return NextResponse.json(await handlePlateDetected(body.licensePlate));
}
