"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AnalyticsCharts({
  revenueByHour,
  occupancyRate,
  entriesToday,
  mostUsedSpots
}: {
  revenueByHour: Array<{ hour: string; revenue: number }>;
  occupancyRate: Array<{ hour: string; rate: number }>;
  entriesToday: Array<{ hour: string; entries: number }>;
  mostUsedSpots: Array<{ name: string; uses: number }>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Revenue by hour">
        <BarChart data={revenueByHour}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 12 }} />
          <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ChartCard>
      <ChartCard title="Occupancy rate">
        <LineChart data={occupancyRate}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 12 }} />
          <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} dot={false} />
        </LineChart>
      </ChartCard>
      <ChartCard title="Entries today">
        <BarChart data={entriesToday}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 12 }} />
          <Bar dataKey="entries" fill="#f59e0b" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ChartCard>
      <ChartCard title="Most used spots">
        <BarChart data={mostUsedSpots}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 12 }} />
          <Bar dataKey="uses" fill="#38bdf8" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
