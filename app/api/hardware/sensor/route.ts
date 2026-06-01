import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateHardwareKey, hardwareUnauthorized } from "@/lib/hardware-auth";
import { updateSensor } from "@/services/hardwareService";

const schema = z.object({
  spotCode: z.string().optional(),
  sensorId: z.string().optional(),
  occupied: z.boolean()
});

export async function POST(request: NextRequest) {
  if (!validateHardwareKey(request)) return hardwareUnauthorized();

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "occupied (boolean) and spotCode or sensorId are required" }, { status: 400 });
  }
  const { spotCode, sensorId, occupied } = parsed.data;
  if (!spotCode && !sensorId) {
    return NextResponse.json({ error: "Provide spotCode or sensorId" }, { status: 400 });
  }

  const source = request.headers.get("x-forwarded-for") ?? undefined;
  const result = await updateSensor(spotCode ?? "", occupied, sensorId, source);

  return NextResponse.json(result);
}
