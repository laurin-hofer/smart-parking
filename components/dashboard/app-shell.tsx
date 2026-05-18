"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CarFront, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  active
}: {
  children: React.ReactNode;
  active: "user" | "admin";
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen soft-grid px-4 py-5 md:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="glass mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-4 py-3">
          <Link href="/user" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-glow">
              <CarFront className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-white">Smart Parking</p>
              <p className="text-xs text-slate-400">Live parking management</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/user"
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10",
                active === "user" && "bg-white/10 text-white"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              User
            </Link>
            <Link
              href="/admin"
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10",
                active === "admin" && "bg-white/10 text-white"
              )}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
            {active === "admin" && (
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </div>
        </nav>
        {children}
      </div>
    </main>
  );
}
