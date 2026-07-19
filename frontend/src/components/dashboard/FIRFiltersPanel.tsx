import type { FIRPriority, FIRStatus } from "../../types";

const statusOptions: FIRStatus[] = ["pending", "investigating", "solved", "closed"];
const priorityOptions: FIRPriority[] = ["low", "medium", "high", "critical"];

interface FIRFiltersPanelProps {
  statusFilters: FIRStatus[];
  priorityFilters: FIRPriority[];
  onToggleStatus: (status: FIRStatus) => void;
  onTogglePriority: (priority: FIRPriority) => void;
}

export function FIRFiltersPanel({
  statusFilters,
  priorityFilters,
  onToggleStatus,
  onTogglePriority,
}: FIRFiltersPanelProps) {
  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Status Filters
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {statusOptions.map((status) => {
            const active = statusFilters.includes(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => onToggleStatus(status)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  active
                    ? "border-cyan-accent/40 bg-cyan-accent/15 text-cyan-accent"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-cyan-accent/20 hover:text-white"
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Priority Filters
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {priorityOptions.map((priority) => {
            const active = priorityFilters.includes(priority);
            return (
              <button
                key={priority}
                type="button"
                onClick={() => onTogglePriority(priority)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  active
                    ? "border-cyan-accent/40 bg-cyan-accent/15 text-cyan-accent"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-cyan-accent/20 hover:text-white"
                }`}
              >
                {priority}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
