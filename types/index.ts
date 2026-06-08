export type SpotStatus = "FREE" | "OCCUPIED" | "RESERVED" | "SENSOR_UNKNOWN";
export type SessionStatus = "ACTIVE" | "PAID" | "EXITED";

export type ParkingSpot = {
  id: string;
  code: string;
  status: SpotStatus;
  sensorId: string | null;
  lastSensorAt: string | null;
  activeSessionId?: string | null;
  activeSessionStatus?: SessionStatus | null;
  activeLicensePlate?: string | null;
};

export type Vehicle = {
  id: string;
  licensePlate: string;
  ownerName: string;
  note: string | null;
  isAllowed: boolean;
  createdAt: string;
};

export type ParkingSession = {
  id: string;
  vehicleId: string;
  spotId: string | null;
  status: SessionStatus;
  enteredAt: string;
  paidAt: string | null;
  exitedAt: string | null;
  exitAllowed: boolean;
  paymentMethod: string | null;
  priceCents: number;
  vehicle: Vehicle;
  spot: ParkingSpot | null;
};

export type HardwareEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  source: string | null;
  createdAt: string;
};

export type SystemState = {
  entryLocked: boolean;
  entryLockedAt: string | null;
  latestPendingPlate: string | null;
};

export type EventLog = {
  id: string;
  type: string;
  message: string;
  licensePlate: string | null;
  spotCode: string | null;
  createdAt: string;
};

export type UnpaidExit = {
  id: string;
  vehicleId: string;
  spotId: string | null;
  status: "EXITED";
  enteredAt: string;
  exitedAt: string;
  priceCents: number;
  vehicle: Vehicle;
  spot: ParkingSpot | null;
};

export type DashboardData = {
  systemState: SystemState;
  stats: {
    total: number;
    free: number;
    occupied: number;
    reserved: number;
    sensorUnknown: number;
    activeSessions: number;
    paidSessions: number;
    revenueTodayCents: number;
    registeredVehicles: number;
  };
  spots: ParkingSpot[];
  sessions: (ParkingSession & { currentPriceCents: number })[];
  vehicles: Vehicle[];
  hardwareEvents: HardwareEvent[];
  logs: EventLog[];
  unpaidExits: UnpaidExit[];
};
