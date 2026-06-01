"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeEuro,
  Car,
  Check,
  DoorOpen,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  Users,
  Wrench,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { EventFeed } from "@/components/logs/event-feed";
import { ParkingMap } from "@/components/parking/parking-map";
import { StatusBadge } from "@/components/parking/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, Td, Th } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { formatCents } from "@/lib/pricing";
import { durationLabel } from "@/lib/utils";
import type { DashboardData } from "@/types";

type VehicleForm = { id?: string; licensePlate: string; ownerName: string; note: string; isAllowed: boolean };
const emptyVehicle: VehicleForm = { licensePlate: "", ownerName: "", note: "", isAllowed: true };

export default function AdminPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [form, setForm] = useState<VehicleForm>(emptyVehicle);
  const [search, setSearch] = useState("");
  const [logQuery, setLogQuery] = useState("");

  async function load() {
    try {
      setData(await api<DashboardData>("/api/dashboard"));
    } catch {
      toast.error("Failed to load dashboard data");
    }
  }

  useEffect(() => {
    load();
    const poll = setInterval(load, 3_000);
    return () => clearInterval(poll);
  }, []);

  const vehicles = useMemo(() => {
    if (!data) return [];
    const needle = search.toLowerCase();
    return data.vehicles.filter((v) =>
      [v.licensePlate, v.ownerName, v.note ?? ""].some((f) => f.toLowerCase().includes(needle))
    );
  }, [data, search]);

  const logs = useMemo(() => {
    if (!data) return [];
    const needle = logQuery.toLowerCase();
    return data.logs.filter((l) =>
      [l.type, l.message, l.licensePlate ?? "", l.spotCode ?? ""].some((f) => f.toLowerCase().includes(needle))
    );
  }, [data, logQuery]);

  async function saveVehicle(e: FormEvent) {
    e.preventDefault();
    const method = form.id ? "PATCH" : "POST";
    const url = form.id ? `/api/vehicles/${form.id}` : "/api/vehicles";
    await api(url, { method, body: JSON.stringify({ licensePlate: form.licensePlate, ownerName: form.ownerName, note: form.note, isAllowed: form.isAllowed }) });
    toast.success(form.id ? "Vehicle updated" : "Vehicle added");
    setForm(emptyVehicle);
    await load();
  }

  async function removeVehicle(id: string) {
    await api(`/api/vehicles/${id}`, { method: "DELETE" });
    toast.success("Vehicle deleted");
    await load();
  }

  async function toggleAccess(id: string, isAllowed: boolean) {
    await api(`/api/vehicles/${id}`, { method: "PATCH", body: JSON.stringify({ isAllowed }) });
    await load();
  }

  async function setSpotStatus(id: string, status: string) {
    await api(`/api/parking-spots/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    toast.success("Spot updated");
    await load();
  }

  async function forceExit(sessionId: string) {
    await api(`/api/parking-sessions/${sessionId}`, { method: "PATCH", body: JSON.stringify({ forceExit: true }) });
    toast.success("Session force-closed");
    await load();
  }

  async function markPaid(sessionId: string) {
    await api("/api/payments", { method: "POST", body: JSON.stringify({ sessionId }) });
    toast.success("Marked as paid");
    await load();
  }

  async function demoEntry() {
    await api("/api/admin/demo-entry", { method: "POST", body: JSON.stringify({}) });
    toast.success("Demo entry simulated");
    await load();
  }

  async function resetDemo() {
    await api("/api/admin/reset-demo", { method: "POST", body: JSON.stringify({}) });
    toast.success("Demo reset complete — all spots freed");
    await load();
  }

  async function randomEvent() {
    await api("/api/simulation/random-event", { method: "POST" });
    toast.success("Random hardware event simulated");
    await load();
  }

  if (!data) {
    return (
      <AppShell active="admin">
        <div className="glass rounded-2xl p-10 text-slate-300">Loading admin dashboard…</div>
      </AppShell>
    );
  }

  const { stats, systemState } = data;

  return (
    <AppShell active="admin">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-indigo-200">Admin</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Control Center</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={randomEvent}>
            <Zap className="h-4 w-4" />
            Simulate Event
          </Button>
          <Button onClick={demoEntry}>
            <Car className="h-4 w-4" />
            Demo Entry
          </Button>
          <Button variant="destructive" onClick={resetDemo}>
            <RotateCcw className="h-4 w-4" />
            Reset Demo
          </Button>
        </div>
      </div>

      {/* System State Banner */}
      <div className={`mb-4 flex items-center gap-3 rounded-2xl border px-5 py-3 ${
        systemState.entryLocked
          ? "border-amber-400/30 bg-amber-500/10"
          : "border-emerald-400/20 bg-emerald-500/5"
      }`}>
        {systemState.entryLocked ? (
          <>
            <Lock className="h-5 w-5 text-amber-400" />
            <div>
              <span className="font-semibold text-amber-200">Entry locked</span>
              {systemState.latestPendingPlate && (
                <span className="ml-2 text-sm text-amber-300">OCR in progress for <strong>{systemState.latestPendingPlate}</strong></span>
              )}
            </div>
          </>
        ) : (
          <>
            <LockOpen className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold text-emerald-200">Entry open — system ready</span>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <StatCard title="Active sessions" value={stats.activeSessions} icon={Car} tone="red" />
        <StatCard title="Revenue today" value={formatCents(stats.revenueTodayCents)} icon={BadgeEuro} tone="green" />
        <StatCard title="Free spots" value={stats.free} icon={DoorOpen} tone="green" />
        <StatCard title="Vehicles registered" value={stats.registeredVehicles} icon={Users} tone="indigo" />
      </div>

      {/* Sessions + Hardware Events */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="glass">
          <CardHeader><CardTitle>Active sessions</CardTitle></CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Plate</Th>
                  <Th>Spot</Th>
                  <Th>Entered</Th>
                  <Th>Duration</Th>
                  <Th>Fee</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((session) => (
                  <tr key={session.id}>
                    <Td className="font-mono font-medium text-white">{session.vehicle.licensePlate}</Td>
                    <Td>{session.spot?.code ?? <span className="text-xs text-amber-300">pending…</span>}</Td>
                    <Td className="text-xs">{new Date(session.enteredAt).toLocaleTimeString("de-AT")}</Td>
                    <Td className="text-xs" suppressHydrationWarning>{durationLabel(session.enteredAt)}</Td>
                    <Td className="font-medium text-white">{formatCents(session.currentPriceCents)}</Td>
                    <Td><StatusBadge status={session.status} /></Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="secondary" onClick={() => markPaid(session.id)} disabled={session.status !== "ACTIVE"}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => forceExit(session.id)}>
                          Exit
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {data.sessions.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">No active sessions.</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle>Hardware events</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-[340px] space-y-2 overflow-auto">
              {data.hardwareEvents.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-500">No hardware events yet.</p>
              )}
              {data.hardwareEvents.map((ev) => (
                <div key={ev.id} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="border-violet-400/20 bg-violet-500/10 text-violet-300 text-[10px]">
                      {ev.type.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-[10px] text-slate-500">
                      {new Date(ev.createdAt).toLocaleTimeString("de-AT")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 font-mono">
                    {JSON.stringify(ev.payload)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parking Map + Spot controls */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="glass">
          <CardHeader><CardTitle>Parking map</CardTitle></CardHeader>
          <CardContent><ParkingMap spots={data.spots} /></CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle>Spot management</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {data.spots.map((spot) => (
                <div key={spot.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <div>
                    <p className="font-bold text-white">{spot.code}</p>
                    <StatusBadge status={spot.status} className="mt-1" />
                  </div>
                  <Select value={spot.status} onChange={(e) => setSpotStatus(spot.id, e.target.value)}>
                    <option value="FREE">Free</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SENSOR_UNKNOWN">Unknown</option>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle management + Event log */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="glass">
          <CardHeader><CardTitle>Vehicle management</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={saveVehicle} className="grid gap-3 md:grid-cols-2">
              <Input placeholder="License plate" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} required />
              <Input placeholder="Owner name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} required />
              <Textarea className="md:col-span-2" placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <Switch checked={form.isAllowed} onCheckedChange={(c) => setForm({ ...form, isAllowed: c })} />
                Access enabled
              </label>
              <div className="flex justify-end gap-2">
                {form.id && <Button type="button" variant="secondary" onClick={() => setForm(emptyVehicle)}>Cancel</Button>}
                <Button type="submit">
                  <Plus className="h-4 w-4" />
                  {form.id ? "Save" : "Add"}
                </Button>
              </div>
            </form>

            <div className="mt-5 flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-500" />
              <Input placeholder="Search plates, owner, notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="mt-4 overflow-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>Plate</Th>
                    <Th>Owner</Th>
                    <Th>Access</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id}>
                      <Td className="font-mono font-medium text-white">{v.licensePlate}</Td>
                      <Td>{v.ownerName}</Td>
                      <Td>
                        <Switch checked={v.isAllowed} onCheckedChange={(c) => toggleAccess(v.id, c)} />
                      </Td>
                      <Td>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="secondary" onClick={() => setForm({ ...v, note: v.note ?? "" })}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => removeVehicle(v.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle>Event log</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-500" />
              <Input placeholder="Filter events…" value={logQuery} onChange={(e) => setLogQuery(e.target.value)} />
            </div>
            <EventFeed logs={logs.slice(0, 20)} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
