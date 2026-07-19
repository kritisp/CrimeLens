import type { CSSProperties } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle,
  Clock,
  FileText,
  LucideIcon,
  Minus,
} from "lucide-react";
import type { StatCardData } from "../../types";
import { GlassCard } from "../ui/GlassCard";
import { Link } from "react-router-dom";

const iconMap: Record<string, LucideIcon> = {
  "file-text": FileText,
  clock: Clock,
  "check-circle": CheckCircle,
  bot: Bot,
};

interface StatCardProps {
  data: StatCardData;
  index: number;
}

export function StatCard({ data, index }: StatCardProps) {
  const Icon = iconMap[data.icon] ?? FileText;
  const isAI = data.icon === "bot";

  const trendIcon =
    data.trend === "up" ? (
      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
    ) : data.trend === "down" ? (
      <ArrowDownRight className="h-3.5 w-3.5 text-amber-400" />
    ) : (
      <Minus className="h-3.5 w-3.5 text-cyan-accent" />
    );

  const trendColor =
    data.trend === "up"
      ? "text-emerald-400"
      : data.trend === "down"
        ? "text-amber-400"
        : "text-cyan-accent";

  return (
    <Link to={data.href} className="block">
      <GlassCard
        hover
        glow={isAI}
        className="group p-5 animate-fade-in"
        style={{ animationDelay: `${index * 100}ms` } as CSSProperties}
      >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${
            isAI
              ? "bg-gradient-to-br from-cyan-accent/20 to-cyan-glow/10 text-cyan-accent"
              : "bg-white/[0.06] text-slate-300 group-hover:text-cyan-accent"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        {isAI && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm text-slate-400">{data.title}</p>
        <p
          className={`mt-1 text-2xl font-bold tracking-tight ${isAI ? "text-gradient" : "text-white"}`}
        >
          {data.value}
        </p>
        <div className={`mt-2 flex items-center gap-1 text-xs ${trendColor}`}>
          {trendIcon}
          <span>{data.change}</span>
        </div>
      </div>
      </GlassCard>
    </Link>
  );
}
