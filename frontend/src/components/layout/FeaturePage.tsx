import { ArrowRight, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { GlassCard } from "../ui/GlassCard";

interface FeaturePageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  primaryAction?: { label: string; to: string };
}

export function FeaturePage({
  title,
  description,
  icon: Icon,
  primaryAction,
}: FeaturePageProps) {
  return (
    <DashboardLayout>
      <div className="grid-bg space-y-6">
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-accent/20 bg-cyan-accent/10 text-cyan-accent">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
                {title}
              </h1>
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            </div>
          </div>
        </div>

        <GlassCard className="p-6">
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            This workspace is wired for navigation and core interactions. Use the
            controls on the dashboard and AI assistant to operate the case flow.
          </p>
          {primaryAction && (
            <Link
              to={primaryAction.to}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-accent/30 bg-cyan-accent/10 px-4 py-2.5 text-sm font-medium text-cyan-accent transition-colors hover:bg-cyan-accent/20"
            >
              {primaryAction.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
