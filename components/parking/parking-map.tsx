"use client";

import { motion } from "framer-motion";
import { Car, CircleHelp, Clock, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpotStatus, ParkingSpot } from "@/types";

const STYLE: Record<SpotStatus, string> = {
  FREE: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25",
  OCCUPIED: "border-red-400/30 bg-red-500/15 text-red-100 hover:bg-red-500/20",
  RESERVED: "border-amber-400/30 bg-amber-500/15 text-amber-100 hover:bg-amber-500/20",
  SENSOR_UNKNOWN: "border-slate-400/20 bg-slate-500/10 text-slate-300 hover:bg-slate-500/15"
};

const ICON: Record<SpotStatus, React.ElementType> = {
  FREE: Car,
  OCCUPIED: Car,
  RESERVED: Clock,
  SENSOR_UNKNOWN: CircleHelp
};

export function ParkingMap({
  spots,
  selectedId,
  onSelect
}: {
  spots: ParkingSpot[];
  selectedId?: string;
  onSelect?: (spot: ParkingSpot) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {spots.map((spot, index) => {
        const Icon = ICON[spot.status];
        return (
          <motion.button
            key={spot.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.025 }}
            onClick={() => onSelect?.(spot)}
            className={cn(
              "min-h-28 rounded-2xl border p-4 text-left transition",
              STYLE[spot.status],
              selectedId === spot.id && "ring-2 ring-indigo-300",
              onSelect && spot.status === "FREE" && "cursor-pointer",
              onSelect && spot.status !== "FREE" && "cursor-default"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">{spot.code}</span>
              <Icon className="h-5 w-5 opacity-80" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-widest opacity-70">
              {spot.status === "SENSOR_UNKNOWN" ? "Unknown" : spot.status.toLowerCase()}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
