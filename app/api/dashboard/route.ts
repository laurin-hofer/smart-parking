import { NextResponse } from "next/server";
import { getDashboardData } from "@/services/dashboardService";

export async function GET() {
  try {
    return NextResponse.json(await getDashboardData());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    console.error("Dashboard database error:", error);
    return NextResponse.json(
      {
        error: "Database connection failed",
        message,
        hint:
          message.includes("ENOTFOUND") || message.includes("timeout")
            ? "Supabase Direct Connection is often IPv6-only. Use the Supabase Connection Pooler URI as DATABASE_URL, or run the app on IPv6-capable hosting."
            : "Check DATABASE_URL and Supabase database availability."
      },
      { status: 500 }
    );
  }
}
