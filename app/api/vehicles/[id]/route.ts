import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { deleteVehicle, updateVehicle } from "@/services/licensePlateService";

const vehicleUpdateSchema = z.object({
  licensePlate: z.string().min(2).optional(),
  ownerName: z.string().min(2).optional(),
  note: z.string().nullable().optional(),
  isAllowed: z.boolean().optional()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = vehicleUpdateSchema.parse(await request.json());
  return NextResponse.json(await updateVehicle(id, body));
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await query('SELECT * FROM "vehicles" WHERE "id" = $1', [id]).then((r) => r.rows[0] ?? null);
  return NextResponse.json(vehicle);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(await deleteVehicle(id));
}
