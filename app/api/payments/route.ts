import { NextRequest, NextResponse } from "next/server";
import { paySession } from "@/services/paymentService";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { sessionId: string };
  return NextResponse.json(await paySession(body.sessionId));
}
