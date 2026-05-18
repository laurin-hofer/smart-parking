"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BadgeEuro, Car, Check, DoorOpen, Pencil, Plus, Search, ShieldCheck, Trash2, Users, Wrench } from "lucide-react";
import { toast } from "sonner";
import { AnalyticsCharts } from "@/components/charts/analytics-charts";
import { AppShell } from "@/components/dashboard/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { EventFeed } from "@/components/logs/event-feed";
import { ParkingMap } from "@/components/parking/parking-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, Td, Th } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { currentFee, durationLabel, formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/types";

type VehicleForm = { id?: string; licensePlate: string; ownerName: string; note: string; isAllowed: boolean };
const emptyVehicle: VehicleForm = { licensePlate: "", ownerName: "", note: "", isAllowed: true };

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [form, setForm] = useState<VehicleForm>(emptyVehicle);
  const [search, setSearch] = useState("");
  const [logQuery, setLogQuery] = useState("");

  async function load() {
    setData(await api<DashboardData>("/api/dashboard"));
  }

  useEffect(() => {
    load();
    const poll = setInterval(load, 8000);
    return () => clearInterval(poll);
  }, []);

  const vehicles = useMemo(() => {
    if (!data) return [];
    const needle = search.toLowerCase();
    return data.vehicles.filter((vehicle) =>
      [vehicle.licensePlate, vehicle.ownerName, vehicle.note ?? ""].some((field) => field.toLowerCase().includes(needle))
    );
  }, [data, search]);

  const logs = useMemo(() => {
    if (!data) return [];
    const needle = logQuery.toLowerCase();
    return data.logs.filter((log) =>
      [log.type, log.message, log.licensePlate ?? "", log.parkingSpotName ?? ""].some((field) => field.toLowerCase().includes(needle))
    );
  }, [data, logQuery]);

  async function saveVehicle(event: FormEvent) {
    event.preventDefault();
    const method = form.id ? "PATCH" : "POST";
    const url = form.id ? `/api/vehicles/${form.id}` : "/api/vehicles";
    await api(url, {
      method,
      body: JSON.stringify({
        licensePlate: form.licensePlate,
        ownerName: form.ownerName,
        note: form.note,
        isAllowed: form.isAllowed
      })
    });
    toast.success(form.id ? "License plate updated" : "License plate added");
    setForm(emptyVehicle);
    await load();
  }

  async function removeVehicle(id: string) {
    await api(`/api/vehicles/${id}`, { method: "DELETE" });
    toast.success("License plate deleted");
    await load();
  }

  async function toggleAccess(id: string, isAllowed: boolean) {
    await api(`/api/vehicles/${id}`, { method: "PATCH", body: JSON.stringify({ isAllowed }) });
    await load();
  }

  async function setSpot(id: string, status: string) {
    await api(`/api/parking-spots/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    toast.success("Spot updated");
    await load();
  }

  async function sessionAction(sessionId: string, action: "paid" | "exit") {
    if (action === "paid") {
      await api("/api/payments", { method: "POST", body: JSON.stringify({ sessionId }) });
      toast.success("Marked paid");
    } else {
      await api(`/api/parking-sessions/${sessionId}`, { method: "PATCH", body: JSON.stringify({ forceExit: true }) });
      toast.success("Vehicle forced out");
    }
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
        <div className="glass rounded-2xl p-10 text-slate-300">Loading admin dashboard...</div>
      </AppShell>
    );
  }

  return (
    <AppShell active="admin">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-indigo-200">Admin Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Operations control center</h1>
        </div>
        <Button onClick={randomEvent}>
          <Wrench className="h-4 w-4" />
          Simulate Random Event
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard title="Parked" value={data.stats.activeSessions} icon={Car} tone="red" />
        <StatCard title="Revenue today" value={formatCurrency(data.stats.revenueToday)} icon={BadgeEuro} tone="green" />
        <StatCard title="Free spots" value={data.stats.free} icon={DoorOpen} tone="green" />
        <StatCard title="Reservations" value={data.stats.activeReservations} icon={ShieldCheck} tone="amber" />
        <StatCard title="Registered plates" value={data.stats.registeredPlates} icon={Users} tone="indigo" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Vehicle and license plate management</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveVehicle} className="grid gap-3 md:grid-cols-2">
              <Input placeholder="License plate" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} required />
              <Input placeholder="Owner name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} required />
              <Textarea className="md:col-span-2" placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <Switch checked={form.isAllowed} onCheckedChange={(checked) => setForm({ ...form, isAllowed: checked })} />
                Access enabled
              </label>
              <div className="flex justify-end gap-2">
                {form.id ? (
                  <Button type="button" variant="secondary" onClick={() => setForm(emptyVehicle)}>
                    Cancel
                  </Button>
                ) : null}
                <Button type="submit">
                  <Plus className="h-4 w-4" />
                  {form.id ? "Save" : "Add"}
                </Button>
              </div>
            </form>

            <div className="mt-5 flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-500" />
              <Input placeholder="Search plates, owner, notes" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <Td className="font-medium text-white">{vehicle.licensePlate}</Td>
                      <Td>{vehicle.ownerName}</Td>
                      <Td>
                        <Switch checked={vehicle.isAllowed} onCheckedChange={(checked) => toggleAccess(vehicle.id, checked)} />
                      </Td>
                      <Td>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setForm({ ...vehicle, note: vehicle.note ?? "" })}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => removeVehicle(vehicle.id)}>
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
          <CardHeader>
            <CardTitle>Parking spot management</CardTitle>
          </CardHeader>
          <CardContent>
            <ParkingMap spots={data.spots} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.spots.map((spot) => (
                <div key={spot.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <div>
                    <p className="font-medium text-white">{spot.name}</p>
                    <p className="text-xs text-slate-500">{spot.status}</p>
                  </div>
                  <Select value={spot.status} onChange={(event) => setSpot(spot.id, event.target.value)}>
                    <option value="FREE">Free</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Active vehicles</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Plate</Th>
                  <Th>Spot</Th>
                  <Th>Entry</Th>
                  <Th>Duration</Th>
                  <Th>Fee</Th>
                  <Th>Paid</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((session) => (
                  <tr key={session.id}>
                    <Td className="font-medium text-white">
                      {session.vehicle.licensePlate}
                      <br />
                      <span className="text-xs text-slate-500">{session.vehicle.ownerName}</span>
                    </Td>
                    <Td>
                      {session.parkingSpot?.name ?? (
                        <span className="text-xs text-amber-300">Awaiting sensor…</span>
                      )}
                    </Td>
                    <Td>{new Date(session.entryTime).toLocaleTimeString("de-AT")}</Td>
                    <Td>{durationLabel(session.entryTime)}</Td>
                    <Td>{session.parkingSpot ? formatCurrency(currentFee(session.entryTime, session.totalCost)) : "—"}</Td>
                    <Td>
                      {session.status === "PENDING" ? (
                        <Badge className="border-amber-400/20 bg-amber-500/10 text-amber-200">entering</Badge>
                      ) : (
                        <Badge className={session.isPaid ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-amber-400/20 bg-amber-500/10 text-amber-200"}>
                          {session.isPaid ? "paid" : "open"}
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => sessionAction(session.id, "paid")} disabled={session.isPaid || session.status === "PENDING"}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => sessionAction(session.id, "exit")}>
                          Force exit
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {data.sessions.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No active vehicles.</p> : null}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Event logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Input className="mb-4" placeholder="Filter logs" value={logQuery} onChange={(e) => setLogQuery(e.target.value)} />
            <EventFeed logs={logs.slice(0, 18)} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <AnalyticsCharts {...data.analytics} />
      </div>
    </AppShell>
  );
}
