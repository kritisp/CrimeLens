import { Clock, Network, Map, FileText, ArrowRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface InteractiveResponseProps {
  data?: {
    stats?: Array<{ label: string; value: string }>;
    timeline?: Array<{ id: number | string; time: string; title: string; desc: string }>;
    networkPreview?: {
      nodes?: number;
      connections?: number;
      mainEntity: string;
      linkedEntities: string[];
    };
    heatmapPreview?: {
      density: string;
      hotspots: string[];
      coordinates?: number[];
    };
    recommendations?: string[];
    caseId?: string;
    actions?: string[];
  };
}

export function InteractiveResponse({ data }: InteractiveResponseProps) {
  const navigate = useNavigate();

  if (!data) return null;

  const hasStats = data.stats && data.stats.length > 0;
  const hasTimeline = data.timeline && data.timeline.length > 0;
  const hasNetwork = !!data.networkPreview;
  const hasHeatmap = !!data.heatmapPreview;
  const hasRecommendations = data.recommendations && data.recommendations.length > 0;
  const hasActions = data.actions && data.actions.length > 0;

  if (!hasStats && !hasTimeline && !hasNetwork && !hasHeatmap && !hasRecommendations && !hasActions) {
    return null;
  }

  const handleAction = (action: string) => {
    if (action === "open_case" && data.caseId) {
      const cleanId = String(data.caseId).replace("FIR-", "");
      navigate(`/cases?selected=${cleanId}`);
    } else if (action === "open_network") {
      navigate("/network");
    } else if (action === "generate_report") {
      navigate("/reports");
    }
  };

  return (
    <div className="mt-3 space-y-4 border-t border-white/5 pt-3 font-mono text-xs text-slate-300">
      {/* 1. Analytics Cards */}
      {hasStats && (
        <div className="grid grid-cols-2 gap-2">
          {data.stats!.map((s, idx) => (
            <div key={idx} className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{s.label}</div>
              <div className="mt-0.5 text-[11px] font-bold text-white">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Modus Operandi Timeline */}
      {hasTimeline && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2">
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-cyan-accent">
            <Clock className="h-3.5 w-3.5" /> Modus Operandi Timeline
          </div>
          <div className="relative border-l border-white/10 ml-2.5 pl-3.5 space-y-3 pb-1 pt-1">
            {data.timeline!.map((t, idx) => (
              <div key={t.id || idx} className="relative">
                <div className="absolute -left-[19px] top-1 h-2 w-2 rounded-full border border-cyan-accent bg-navy-950 shadow-[0_0_8px_#22d3ee]"></div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-200">
                  <span>{t.title}</span>
                  <span className="text-[9px] text-slate-500 font-normal">{t.time}</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Combined Previews: Network & Heatmap */}
      {(hasNetwork || hasHeatmap) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Network Graph Box */}
          {hasNetwork && (
            <div 
              onClick={() => navigate("/network")}
              className="group flex h-28 cursor-pointer flex-col justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-cyan-accent/25 hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500">
                <span>Network Mapping</span>
                <Network className="h-3.5 w-3.5 text-cyan-accent group-hover:animate-pulse" />
              </div>
              <div className="my-1.5 min-w-0">
                <div className="text-[11px] font-bold text-white group-hover:text-cyan-accent transition-colors truncate">
                  {data.networkPreview!.mainEntity}
                </div>
                {data.networkPreview!.linkedEntities && (
                  <div className="text-[9px] text-slate-500 truncate mt-0.5">
                    Links: {data.networkPreview!.linkedEntities.join(', ')}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-cyan-accent">
                Open Network <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          )}

          {/* Heatmap Geo Box */}
          {hasHeatmap && (
            <div 
              onClick={() => navigate("/crime-intelligence")}
              className="group flex h-28 cursor-pointer flex-col justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-cyan-accent/25 hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500">
                <span>Geographic clusters</span>
                <Map className="h-3.5 w-3.5 text-emerald-400 group-hover:animate-pulse" />
              </div>
              <div className="my-1.5 min-w-0">
                <div className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                  Hotspots: {data.heatmapPreview!.hotspots[0]}
                </div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">
                  Density: {data.heatmapPreview!.density} • Areas: {data.heatmapPreview!.hotspots.slice(1).join(', ')}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                Open GIS Map <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Recommendation Cards */}
      {hasRecommendations && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
            <Zap className="h-3.5 w-3.5 text-amber-500" /> Next Actions
          </div>
          <div className="space-y-1">
            {data.recommendations!.map((rec, idx) => (
              <div key={idx} className="flex gap-2 rounded-lg border border-white/5 bg-white/[0.01] p-2 items-start text-[10px] text-slate-300">
                <Zap className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Navigation Action Buttons */}
      {hasActions && (
        <div className="flex flex-wrap gap-2 pt-1">
          {data.actions!.includes("open_case") && data.caseId && (
            <button 
              onClick={() => handleAction("open_case")}
              className="flex items-center gap-1 rounded-xl bg-cyan-accent px-3 py-1.5 text-[10px] font-bold text-navy-950 transition-all hover:bg-cyan-accent/80 cursor-pointer shadow-md"
            >
              <FileText className="h-3.5 w-3.5"/> Open Case File
            </button>
          )}
          {data.actions!.includes("open_network") && (
            <button 
              onClick={() => handleAction("open_network")}
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-200 transition-all hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <Network className="h-3.5 w-3.5"/> Explore Connections
            </button>
          )}
          {data.actions!.includes("generate_report") && (
            <button 
              onClick={() => handleAction("generate_report")}
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-200 transition-all hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5"/> Print brief
            </button>
          )}
        </div>
      )}
    </div>
  );
}
