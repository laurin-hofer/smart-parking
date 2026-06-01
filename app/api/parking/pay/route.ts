import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { paySession } from "@/services/paymentService";

const schema = z.object({
  sessionId: z.string().min(1),
  paymentMethod: z.enum(["card", "apple_pay"]).default("card")
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  try {
    const session = await paySession(parsed.data.sessionId, parsed.data.paymentMethod);
    return NextResponse.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
