import { cn } from "@/lib/utils";
import type { SpotStatus, SessionStatus } from "@/types";

type BadgeVariant = SpotStatus | SessionStatus | "locked" | "unlocked";

const STYLES: Record<BadgeVariant, string> = {
  FREE: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  OCCUPIED: "border-red-400/20 bg-red-500/10 text-red-300",
  RESERVED: "border-amber-400/20 bg-amber-500/10 text-amber-300",
  SENSOR_UNKNOWN: "border-slate-400/20 bg-slate-500/10 text-slate-400",
  ACTIVE: "border-blue-400/20 bg-blue-500/10 text-blue-300",
  PAID: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  EXITED: "border-slate-400/20 bg-slate-500/10 text-slate-400",
  locked: "border-red-400/20 bg-red-500/10 text-red-300",
  unlocked: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
};

const LABEL: Partial<Record<BadgeVariant, string>> = {
  SENSOR_UNKNOWN: "Unknown",
  locked: "Entry locked",
  unlocked: "Entry open"
};

export function StatusBadge({ status, className }: { status: BadgeVariant; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STYLES[status] ?? "border-slate-400/20 bg-slate-500/10 text-slate-400",
        className
      )}
    >
      {LABEL[status] ?? status}
    </span>
  );
}
