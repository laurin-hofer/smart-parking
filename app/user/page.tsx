"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, Car, Clock, CreditCard, LogIn, MapPin, ParkingCircle, RadioTower, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { EventFeed } from "@/components/logs/event-feed";
import { ParkingMap } from "@/components/parking/parking-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { durationLabel, formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/types";

export default function UserDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [plate, setPlate] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [spotId, setSpotId] = useState("");
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  async function load() {
    setData(await api<DashboardData>("/api/dashboard"));
  }

  useEffect(() => {
    load();
    const poll = setInterval(load, 5000);
    const timer = setInterval(() => setTick((v) => v + 1), 30000);
    return () => {
      clearInterval(poll);
      clearInterval(timer);
    };
  }, []);

  const selectedVehicle = data?.vehicles.find((v) => v.id === vehicleId);
  const ownSession = useMemo(() => {
    if (!data) return null;
    if (plate.trim()) {
      const normalized = plate.trim().toUpperCase().replace(/\s+/g, "");
      return data.sessions.find((s) => s.vehicle.licensePlate === normalized) ?? null;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, plate, tick]);

  async function detectPlate() {
    setLoading(true);
    try {
      const result = await api<{ opened: boolean; reason?: string }>("/api/hardware/plate-detected", {
        method: "POST",
        body: JSON.stringify({ licensePlate: plate || "UNKNOWN" })
      });
      toast(result.opened ? "Barrier opened" : "Barrier denied", {
        description: result.reason ?? "Hardware event processed."
      });
      await load();
    } catch (error) {
      toast.error("Plate detection failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  }

  async function reserveSpot() {
    if (!vehicleId || !spotId) return toast.error("Choose a vehicle and a free spot");
    await api("/api/reservations", { method: "POST", body: JSON.stringify({ vehicleId, parkingSpotId: spotId }) });
    toast.success("Reservation created");
    await load();
  }

  async function payAndExit(action: "pay" | "exit") {
    if (!ownSession) return;
    if (action === "pay") {
      await api("/api/payments", { method: "POST", body: JSON.stringify({ sessionId: ownSession.id }) });
      toast.success("Payment completed");
    } else {
      await api(`/api/parking-sessions/${ownSession.id}`, { method: "PATCH", body: JSON.stringify({ forceExit: ownSession.isPaid }) });
      toast.success("Parking session ended");
    }
    await load();
  }

  if (!data) {
    return (
      <AppShell active="user">
        <div className="glass rounded-2xl p-10 text-slate-300">Loading dashboard...</div>
      </AppShell>
    );
  }

  const freeSpots = data.spots.filter((s) => s.status === "FREE");
  const isPending = ownSession?.status === "PENDING";

  return (
    <AppShell active="user">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-indigo-200">User Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Parking access and status</h1>
        </div>
        <Button variant="secondary" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Free spots" value={data.stats.free} icon={ParkingCircle} tone="green" />
        <StatCard title="Occupied" value={data.stats.occupied} icon={Car} tone="red" />
        <StatCard title="Reserved" value={data.stats.reserved} icon={Clock} tone="amber" />
        <StatCard title="Capacity" value={data.stats.total} icon={RadioTower} tone="indigo" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Parking map</CardTitle>
          </CardHeader>
          <CardContent>
            <ParkingMap spots={data.spots} selectedId={spotId} onSelect={(spot) => spot.status === "FREE" && setSpotId(spot.id)} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Barrier simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Entry barrier</span>
                  <span className="text-sm font-medium text-emerald-200">{data.barrier.entry}</span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{data.barrier.lastDecision}</p>
              </div>
              <Input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="License plate (e.g. W-123AB)"
              />
              <Button className="w-full" onClick={detectPlate} disabled={loading}>
                <Ban className="h-4 w-4" />
                Simulate Plate Detection
              </Button>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Reserve a free spot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                <option value="">Select vehicle</option>
                {data.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate} — {v.ownerName}
                  </option>
                ))}
              </Select>
              <Select value={spotId} onChange={(e) => setSpotId(e.target.value)}>
                <option value="">Select free spot</option>
                {freeSpots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <Button className="w-full" onClick={reserveSpot} disabled={!selectedVehicle || !spotId}>
                <LogIn className="h-4 w-4" />
                Reserve Spot
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="glass">
          <CardHeader>
            <CardTitle>My parking session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="Enter your license plate to find your session"
              />
            </div>

            {ownSession ? (
              isPending ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 space-y-2">
                  <p className="text-lg font-semibold text-white">{ownSession.vehicle.licensePlate}</p>
                  <div className="flex items-center gap-2 text-amber-200">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Entering — please drive to a free spot</span>
                  </div>
                  <p className="text-xs text-slate-400">The sensor will automatically assign your spot.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-2xl font-semibold text-white">{ownSession.vehicle.licensePlate}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {ownSession.parkingSpot?.name ?? "—"} · {durationLabel(ownSession.entryTime)}
                    </p>
                    <p className="mt-4 text-3xl font-semibold text-emerald-200">
                      {formatCurrency(ownSession.currentFee)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => payAndExit("pay")} disabled={ownSession.isPaid}>
                      <CreditCard className="h-4 w-4" />
                      {ownSession.isPaid ? "Paid" : "Pay"}
                    </Button>
                    <Button variant="secondary" onClick={() => payAndExit("exit")} disabled={!ownSession.isPaid}>
                      End Parking
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <p className="text-sm text-slate-400">
                {plate.trim() ? "No active session found for this plate." : "Enter your license plate above to find your session."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Live event feed</CardTitle>
          </CardHeader>
          <CardContent>
            <EventFeed logs={data.logs.slice(0, 10)} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
