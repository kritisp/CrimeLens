import type { FIRPriority, FIRStatus } from "../../types";

const statusStyles: Record<FIRStatus, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  investigating: "bg-cyan-accent/10 text-cyan-accent border-cyan-accent/20",
  solved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const priorityStyles: Record<FIRPriority, string> = {
  low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

interface BadgeProps {
  label: string;
  variant?: "status" | "priority" | "default";
  status?: FIRStatus;
  priority?: FIRPriority;
}

export function Badge({
  label,
  variant = "default",
  status,
  priority,
}: BadgeProps) {
  let style = "bg-white/5 text-slate-300 border-white/10";

  if (variant === "status" && status) {
    style = statusStyles[status];
  } else if (variant === "priority" && priority) {
    style = priorityStyles[priority];
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {label}
    </span>
  );
}
