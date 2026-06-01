import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Reservations have been removed from this system." }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: "Reservations have been removed from this system." }, { status: 410 });
}
