import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { CaseDetailPanel } from "../components/cases/CaseDetailPanel";
import { recentFIRs } from "../data/mockData";
import { GlassCard } from "../components/ui/GlassCard";

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const record = useMemo(() => {
    if (!id) return null;
    return recentFIRs.find((r) => r.id === id || r.firNumber.toLowerCase() === id.toLowerCase()) ?? recentFIRs[0];
  }, [id]);

  if (!record) {
    return (
      <DashboardLayout>
        <div className="grid-bg space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/cases")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-xs font-bold uppercase font-mono hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Back to All Cases
            </button>
          </div>
          <GlassCard className="p-12 text-center text-slate-400 font-mono text-xs">
            <Shield className="h-10 w-10 text-cyan-accent mx-auto mb-3 animate-pulse" />
            <p className="text-white font-bold">Case Record Not Found</p>
            <p className="text-slate-500 mt-1">The requested FIR case identifier "{id}" does not exist in active database records.</p>
          </GlassCard>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="grid-bg space-y-4">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/cases")}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-cyan-accent/20 bg-cyan-accent/10 text-cyan-accent text-xs font-bold uppercase font-mono hover:bg-cyan-accent/20 transition-all shadow-glow"
            >
              <ArrowLeft className="h-4 w-4" /> Back to All Cases
            </button>
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">
              / Cases / <b className="text-white">{record.firNumber}</b>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Standalone Case Dossier</span>
          </div>
        </div>

        {/* Dedicated Full Page Case Dossier View */}
        <CaseDetailPanel record={record} onClose={() => navigate("/cases")} />
      </div>
    </DashboardLayout>
  );
}
