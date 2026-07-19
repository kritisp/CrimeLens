import {
  BarChart3,
  FilePlus,
  LucideIcon,
  Search,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { QuickAction } from "../../types";
import { GlassCard } from "../ui/GlassCard";

const iconMap: Record<string, LucideIcon> = {
  "file-plus": FilePlus,
  sparkles: Sparkles,
  search: Search,
  "bar-chart-3": BarChart3,
};

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map((action, index) => {
        const Icon = iconMap[action.icon] ?? FilePlus;
        const isPrimary = action.variant === "primary";

        return (
          <Link
            key={action.label}
            to={action.href}
            style={{ animationDelay: `${index * 80}ms` }}
            className="animate-fade-in text-left"
          >
            <GlassCard
              hover
              className={`group h-full p-4 ${
                isPrimary
                  ? "border-cyan-accent/20 bg-gradient-to-br from-cyan-accent/10 to-transparent"
                  : ""
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${
                  isPrimary
                    ? "bg-gradient-to-br from-cyan-accent to-cyan-glow text-navy-950 shadow-glow"
                    : "bg-white/[0.06] text-slate-300 group-hover:bg-cyan-accent/10 group-hover:text-cyan-accent"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white group-hover:text-cyan-accent transition-colors">
                {action.label}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{action.description}</p>
            </GlassCard>
          </Link>
        );
      })}
    </div>
  );
}
