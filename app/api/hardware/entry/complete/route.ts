import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateHardwareKey, hardwareUnauthorized } from "@/lib/hardware-auth";
import { completeEntry } from "@/services/hardwareService";

const schema = z.object({
  plate: z.string().min(1),
  spotCode: z.string().min(1)
});

export async function POST(request: NextRequest) {
  if (!validateHardwareKey(request)) return hardwareUnauthorized();

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "plate and spotCode are required", details: parsed.error.flatten() }, { status: 400 });
  }

  const source = request.headers.get("x-forwarded-for") ?? undefined;
  const result = await completeEntry(parsed.data.plate, parsed.data.spotCode, source);

  return NextResponse.json(result, { status: result.success ? 200 : 403 });
}
