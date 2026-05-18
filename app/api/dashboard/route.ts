import { NextResponse } from "next/server";
import { getDashboardData } from "@/services/dashboardService";

export async function GET() {
  return NextResponse.json(await getDashboardData());
}
