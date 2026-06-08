"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CarFront, Clock, MapPin, ParkingCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PaymentDialog } from "@/components/parking/payment-dialog";
import { StatusBadge } from "@/components/parking/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { formatCents } from "@/lib/pricing";
import { durationLabel } from "@/lib/utils";
import type { ParkingSession, ParkingSpot } from "@/types";

type SessionWithPrice = ParkingSession & { currentPriceCents: number };

export default function UserPage() {
  const [plate, setPlate] = useState("");
  const [session, setSession] = useState<SessionWithPrice | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  // tick forces re-render for live duration display
  const [, setTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSpots = useCallback(async () => {
    try {
      const data = await api<ParkingSpot[]>("/api/parking/spots");
      setSpots(data);
    } catch {
      // silently ignore background refresh errors
    }
  }, []);

  const fetchSession = useCallback(async (p: string) => {
    if (!p.trim()) { setSession(null); return; }
    try {
      const data = await api<SessionWithPrice | null>(`/api/parking/session?plate=${encodeURIComponent(p.trim())}`);
      setSession(data);
    } catch {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    fetchSpots();
    const spotsInterval = setInterval(fetchSpots, 10_000);
    const tickInterval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => { clearInterval(spotsInterval); clearInterval(tickInterval); };
  }, [fetchSpots]);

  useEffect(() => {
    if (!plate.trim()) return;
    fetchSession(plate);
    const interval = setInterval(() => fetchSession(plate), 5_000);
    return () => clearInterval(interval);
  }, [plate, fetchSession]);

  async function handleSearch() {
    if (!plate.trim()) { toast.error("Enter your license plate"); return; }
    setLoading(true);
    await fetchSession(plate);
    setLoading(false);
  }

  const freeCount = spots.filter((s) => s.status === "FREE").length;

  return (
    <main className="min-h-screen soft-grid flex flex-col">
      <header className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 shadow-glow">
            <CarFront className="h-5 w-5 text-white" />
          </span>
          <span className="font-semibold text-white">Smart Parking</span>
        </Link>
        <Link href="/map" className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10 transition">
          <MapPin className="h-4 w-4" />
          Map
        </Link>
      </header>

      <div className="mx-auto w-full max-w-md flex-1 px-4 py-8 flex flex-col gap-6">
        {/* Availability indicator */}
        <div className="glass rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ParkingCircle className="h-6 w-6 text-emerald-400" />
            <div>
              <p className="text-sm text-slate-400">Free spots</p>
              <p className="text-2xl font-bold text-white">
                {freeCount}
                <span className="ml-1.5 text-base font-normal text-slate-400">of {spots.length}</span>
              </p>
            </div>
          </div>
          <button onClick={fetchSpots} className="rounded-xl p-2 text-slate-400 hover:text-white transition">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Session lookup */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Find your session</h2>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. I-00000A"
              className="flex-1 text-center text-lg font-mono tracking-widest uppercase"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "…" : "Find"}
            </Button>
          </div>
          {plate.trim() && !session && (
            <p className="text-center text-sm text-slate-500">No active session found for this plate.</p>
          )}
        </div>

        {/* Active session */}
        {session && (
          <div className="glass rounded-2xl p-5 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Your session</p>
                <p className="mt-1 text-2xl font-bold text-white font-mono">{session.vehicle.licensePlate}</p>
              </div>
              <StatusBadge status={session.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-slate-400">Spot</p>
                <p className="mt-1 font-semibold text-white text-lg">{session.spot?.code ?? "—"}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-xs text-slate-400">Duration</p>
                </div>
                <p className="mt-1 font-semibold text-white" suppressHydrationWarning>
                  {durationLabel(session.enteredAt)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-widest">
                {session.status === "PAID" ? "Amount paid" : "Current fee"}
              </p>
              <p className="mt-1.5 text-5xl font-bold text-white" suppressHydrationWarning>
                {formatCents(session.currentPriceCents)}
              </p>
              <p className="mt-2 text-xs text-slate-500">€0.05 / minute · min. €0.50</p>
            </div>

            {session.status === "ACTIVE" && (
              <Button className="w-full text-base py-6 rounded-xl" onClick={() => setShowPayment(true)}>
                Pay now
              </Button>
            )}

            {session.status === "PAID" && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-4 text-center space-y-1">
                <p className="text-emerald-300 font-semibold">Payment confirmed ✓</p>
                <p className="text-sm text-slate-400">Drive to the exit — the barrier will open automatically.</p>
              </div>
            )}
          </div>
        )}

        {/* Spot grid overview */}
        {spots.length > 0 && (
          <div className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Spot overview</h2>
            <div className="grid grid-cols-4 gap-2">
              {spots.map((spot) => (
                <div
                  key={spot.id}
                  className={`rounded-xl border p-2 text-center ${
                    spot.status === "FREE"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                      : spot.status === "OCCUPIED"
                      ? "border-red-400/30 bg-red-500/10 text-red-300"
                      : "border-slate-400/20 bg-slate-500/10 text-slate-400"
                  }`}
                >
                  <p className="text-xs font-bold">{spot.code}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">
                    {spot.status === "FREE" ? "Free" : spot.status === "OCCUPIED" ? "Full" : spot.status === "RESERVED" ? "Res." : "?"}
                  </p>
                  {spot.activeLicensePlate && (
                    <p className="mt-1 truncate font-mono text-[10px] font-bold text-white">
                      {spot.activeLicensePlate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="py-4 text-center text-xs text-slate-600 space-x-4">
        <Link href="/map" className="hover:text-slate-400 transition">Parking Map</Link>
        <Link href="/admin" className="hover:text-slate-400 transition">Admin</Link>
      </footer>

      {showPayment && session && (
        <PaymentDialog
          sessionId={session.id}
          priceCents={session.currentPriceCents}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); fetchSession(plate); }}
        />
      )}
    </main>
  );
}
