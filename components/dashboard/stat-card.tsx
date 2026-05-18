import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "indigo"
}: {
  title: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  tone?: "indigo" | "green" | "amber" | "red" | "slate";
}) {
  const colors = {
    indigo: "bg-indigo-500/15 text-indigo-200",
    green: "bg-emerald-500/15 text-emerald-200",
    amber: "bg-amber-500/15 text-amber-200",
    red: "bg-red-500/15 text-red-200",
    slate: "bg-slate-500/15 text-slate-200"
  };
  return (
    <Card className="glass">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
          {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
        </div>
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}
