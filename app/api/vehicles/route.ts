import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createVehicle, listVehicles } from "@/services/licensePlateService";

const vehicleSchema = z.object({
  licensePlate: z.string().min(2),
  ownerName: z.string().min(2),
  note: z.string().optional(),
  isAllowed: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") ?? undefined;
  return NextResponse.json(await listVehicles(search));
}

export async function POST(request: NextRequest) {
  const body = vehicleSchema.parse(await request.json());
  return NextResponse.json(await createVehicle(body), { status: 201 });
}
