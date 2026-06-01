import { NextRequest, NextResponse } from "next/server";
import { paySession } from "@/services/paymentService";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { sessionId: string; paymentMethod?: string };
  try {
    return NextResponse.json(await paySession(body.sessionId, body.paymentMethod));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
