"use client";

import { useCallback, useEffect, useState } from "react";
import { CarFront, RefreshCw } from "lucide-react";
import Link from "next/link";
import { ParkingMap } from "@/components/parking/parking-map";
import { api } from "@/lib/api";
import type { ParkingSpot } from "@/types";

export default function MapPage() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<ParkingSpot[]>("/api/parking/spots");
      setSpots(data);
      setLastUpdated(new Date());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [load]);

  const free = spots.filter((s) => s.status === "FREE").length;
  const occupied = spots.filter((s) => s.status === "OCCUPIED").length;

  return (
    <main className="min-h-screen soft-grid flex flex-col">
      <header className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 shadow-glow">
            <CarFront className="h-5 w-5 text-white" />
          </span>
          <span className="font-semibold text-white">Smart Parking</span>
        </Link>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500" suppressHydrationWarning>
              Updated {lastUpdated.toLocaleTimeString("de-AT")}
            </span>
          )}
          <button onClick={load} className="rounded-xl p-2 text-slate-400 hover:text-white transition">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Parking availability</h1>
          <p className="mt-1 text-slate-400">Live map — updates every 10 seconds</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">{free}</p>
            <p className="text-xs text-slate-400 mt-1">Free</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{occupied}</p>
            <p className="text-xs text-slate-400 mt-1">Occupied</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{spots.length}</p>
            <p className="text-xs text-slate-400 mt-1">Total</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          {spots.length > 0 ? (
            <ParkingMap spots={spots} />
          ) : (
            <p className="py-12 text-center text-slate-500">Loading map…</p>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          {[
            { color: "bg-emerald-500/20 border-emerald-400/30", label: "Free" },
            { color: "bg-red-500/20 border-red-400/30", label: "Occupied" },
            { color: "bg-amber-500/20 border-amber-400/30", label: "Reserved" },
            { color: "bg-slate-500/10 border-slate-400/20", label: "Unknown" }
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`h-4 w-4 rounded border ${color}`} />
              <span className="text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
