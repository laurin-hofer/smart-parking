import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Reservations have been removed from this system." }, { status: 410 });
}

export async function PATCH() {
  return NextResponse.json({ error: "Reservations have been removed from this system." }, { status: 410 });
}
