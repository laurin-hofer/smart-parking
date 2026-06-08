import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type EventFeedLog = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  licensePlate?: string | null;
  spotCode?: string | null;
  unpaidExitSessionId?: string | null;
};

export function EventFeed({
  logs,
  onPenalty
}: {
  logs: EventFeedLog[];
  onPenalty?: (sessionId: string) => void;
}) {
  return (
    <div className="max-h-[440px] space-y-3 overflow-auto pr-1">
      {logs.length === 0 ? <p className="text-sm text-slate-500">No events yet.</p> : null}
      {logs.map((log) => (
        <div
          key={log.id}
          className={`rounded-xl border p-3 ${
            log.unpaidExitSessionId
              ? "border-red-400/40 bg-red-500/10 shadow-[0_0_22px_rgba(248,113,113,0.28)]"
              : "border-white/5 bg-white/[0.03]"
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <Badge className="border-indigo-400/20 bg-indigo-500/10 text-indigo-200">{log.type.replaceAll("_", " ")}</Badge>
            <span className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleTimeString("de-AT")}</span>
          </div>
          {(log.licensePlate || log.spotCode || log.unpaidExitSessionId) && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {log.licensePlate && (
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs font-semibold text-white">
                  {log.licensePlate}
                </span>
              )}
              {log.spotCode && <span className="text-xs text-slate-400">Spot {log.spotCode}</span>}
              {log.unpaidExitSessionId && onPenalty && (
                <Button size="sm" variant="destructive" onClick={() => onPenalty(log.unpaidExitSessionId!)}>
                  Strafen
                </Button>
              )}
            </div>
          )}
          <p className="text-sm leading-6 text-slate-300">{log.message}</p>
        </div>
      ))}
    </div>
  );
}
