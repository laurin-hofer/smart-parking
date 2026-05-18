"use client";

import { motion } from "framer-motion";
import { Car, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type Spot = {
  id: string;
  name: string;
  status: "FREE" | "RESERVED" | "OCCUPIED" | "MAINTENANCE";
  assignedVehicle?: { licensePlate: string; ownerName: string } | null;
};

const styles = {
  FREE: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  RESERVED: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  OCCUPIED: "border-red-400/30 bg-red-500/15 text-red-100",
  MAINTENANCE: "border-slate-400/20 bg-slate-500/15 text-slate-200"
};

export function ParkingMap({ spots, selectedId, onSelect }: { spots: Spot[]; selectedId?: string; onSelect?: (spot: Spot) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {spots.map((spot, index) => (
        <motion.button
          key={spot.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.025 }}
          onClick={() => onSelect?.(spot)}
          className={cn(
            "min-h-32 rounded-2xl border p-4 text-left transition hover:scale-[1.02]",
            styles[spot.status],
            selectedId === spot.id && "ring-2 ring-indigo-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{spot.name}</span>
            {spot.status === "MAINTENANCE" ? <Wrench className="h-5 w-5" /> : <Car className="h-5 w-5" />}
          </div>
          <p className="mt-6 text-xs font-medium uppercase tracking-wide">{spot.status}</p>
          <p className="mt-1 truncate text-sm text-white/70">
            {spot.assignedVehicle?.licensePlate ?? (spot.status === "FREE" ? "Available now" : "No vehicle assigned")}
          </p>
        </motion.button>
      ))}
    </div>
  );
}
