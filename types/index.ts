export type DashboardData = {
  stats: {
    total: number;
    free: number;
    occupied: number;
    reserved: number;
    maintenance: number;
    activeReservations: number;
    activeSessions: number;
    registeredPlates: number;
    revenueToday: number;
  };
  barrier: {
    entry: "OPEN" | "CLOSED";
    exit: "OPEN" | "CLOSED";
    lastDecision: string;
  };
  spots: Array<{
    id: string;
    name: string;
    status: "FREE" | "RESERVED" | "OCCUPIED" | "MAINTENANCE";
    assignedVehicleId: string | null;
    assignedVehicle?: { licensePlate: string; ownerName: string } | null;
  }>;
  vehicles: Array<{
    id: string;
    licensePlate: string;
    ownerName: string;
    note: string | null;
    isAllowed: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  sessions: Array<any>;
  reservations: Array<any>;
  logs: Array<any>;
  analytics: {
    revenueByHour: Array<{ hour: string; revenue: number }>;
    occupancyRate: Array<{ hour: string; rate: number }>;
    entriesToday: Array<{ hour: string; entries: number }>;
    mostUsedSpots: Array<{ name: string; uses: number }>;
  };
};
