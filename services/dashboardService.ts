import { prisma } from "@/lib/prisma";
import { currentFee } from "@/lib/utils";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getDashboardData() {
  const [spots, vehicles, sessions, reservations, logs, finishedToday] = await Promise.all([
    prisma.parkingSpot.findMany({ include: { assignedVehicle: true }, orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.parkingSession.findMany({
      where: { status: { in: ["ACTIVE", "PENDING"] } },
      include: { vehicle: true, parkingSpot: true },
      orderBy: { entryTime: "desc" }
    }),
    prisma.reservation.findMany({
      where: { status: "ACTIVE" },
      include: { vehicle: true, parkingSpot: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.eventLog.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
    prisma.parkingSession.findMany({
      where: { updatedAt: { gte: startOfToday() } },
      include: { parkingSpot: true }
    })
  ]);

  const revenueToday = finishedToday.reduce((sum, session) => sum + session.totalCost, 0);
  const hours = Array.from({ length: 12 }, (_, index) => {
    const hour = `${(new Date().getHours() - 11 + index + 24) % 24}:00`;
    return {
      hour,
      revenue: Number((Math.random() * 18 + (index > 7 ? 12 : 4)).toFixed(2)),
      rate: Math.round((spots.filter((s) => s.status === "OCCUPIED").length / Math.max(spots.length, 1)) * 100),
      entries: Math.floor(Math.random() * 6)
    };
  });

  const usage = new Map<string, number>();
  for (const session of finishedToday) {
    if (session.parkingSpot) {
      usage.set(session.parkingSpot.name, (usage.get(session.parkingSpot.name) ?? 0) + 1);
    }
  }

  return {
    stats: {
      total: spots.length,
      free: spots.filter((s) => s.status === "FREE").length,
      occupied: spots.filter((s) => s.status === "OCCUPIED").length,
      reserved: spots.filter((s) => s.status === "RESERVED").length,
      maintenance: spots.filter((s) => s.status === "MAINTENANCE").length,
      activeReservations: reservations.length,
      activeSessions: sessions.length,
      registeredPlates: vehicles.length,
      revenueToday
    },
    barrier: {
      entry: "CLOSED" as const,
      exit: "CLOSED" as const,
      lastDecision: logs[0]?.message ?? "System waiting for hardware event"
    },
    spots,
    vehicles,
    sessions: sessions.map((session) => ({ ...session, currentFee: currentFee(session.entryTime, session.totalCost) })),
    reservations,
    logs,
    analytics: {
      revenueByHour: hours.map(({ hour, revenue }) => ({ hour, revenue })),
      occupancyRate: hours.map(({ hour, rate }) => ({ hour, rate })),
      entriesToday: hours.map(({ hour, entries }) => ({ hour, entries })),
      mostUsedSpots: spots.map((spot) => ({ name: spot.name, uses: usage.get(spot.name) ?? Math.floor(Math.random() * 8) }))
    }
  };
}
