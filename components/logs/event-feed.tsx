import { Badge } from "@/components/ui/badge";

export function EventFeed({ logs }: { logs: Array<{ id: string; type: string; message: string; createdAt: string }> }) {
  return (
    <div className="max-h-[440px] space-y-3 overflow-auto pr-1">
      {logs.length === 0 ? <p className="text-sm text-slate-500">No events yet.</p> : null}
      {logs.map((log) => (
        <div key={log.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <Badge className="border-indigo-400/20 bg-indigo-500/10 text-indigo-200">{log.type.replaceAll("_", " ")}</Badge>
            <span className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleTimeString("de-AT")}</span>
          </div>
          <p className="text-sm leading-6 text-slate-300">{log.message}</p>
        </div>
      ))}
    </div>
  );
}
