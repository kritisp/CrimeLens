import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Cpu, 
  Award 
} from 'lucide-react';

export default function JudgePresentationConsole() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Step 1: Intelligence Mission Control",
      path: "/dashboard",
      engine: "FastAPI REST Gateway & SQLite Persistent Store",
      summary: "Real-time dashboard tracking Karnataka State Police active cases, spatial incident alerts, and recent AI findings.",
      actionLabel: "Next: Crime Intelligence"
    },
    {
      title: "Step 2: Crime Intelligence & DBSCAN Hotspots",
      path: "/intelligence",
      engine: "DBSCAN Spatial Clustering & Haversine Geocoding",
      summary: "Evaluates district-level risk factors, spatial cluster hotspots, patrol route suggestions, and predictive trends.",
      actionLabel: "Next: Network Explorer"
    },
    {
      title: "Step 3: Graph Intelligence Explorer",
      path: "/network",
      engine: "NetworkX Community Detection (Modularity) & Closeness Centrality",
      summary: "Interactive spatial-temporal topology grouping suspect gangs into clusters and identifying prime leaders through closeness centrality.",
      actionLabel: "Next: AI Assistant & Copilot"
    },
    {
      title: "Step 4: AI Assistant & Tactical Dispatch",
      path: "/ai-assistant",
      engine: "SentenceTransformers (all-MiniLM-L6-v2) + FAISS Vector Search",
      summary: "Automated pattern recognition, rule-based playbooks, and vector-search natural language query resolution.",
      actionLabel: "Next: Register FIR Intake"
    },
    {
      title: "Step 5: Automated FIR Intake & Geocoding",
      path: "/register-fir",
      engine: "Automated Offense Classifier & Normalized Relational Ingestion",
      summary: "Ingests new FIRs with automatic severity scoring, station geocoding, and dual-table atomic persistence.",
      actionLabel: "Complete Tour"
    }
  ];

  const current = steps[currentStep];

  const handleNextStep = () => {
    const nextIdx = (currentStep + 1) % steps.length;
    setCurrentStep(nextIdx);
    navigate(steps[nextIdx].path);
  };

  const handlePrevStep = () => {
    const prevIdx = (currentStep - 1 + steps.length) % steps.length;
    setCurrentStep(prevIdx);
    navigate(steps[prevIdx].path);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 hover:border-blue-500 transition-all group cursor-pointer"
        >
          <div className="bg-blue-500/20 p-1.5 rounded-lg text-blue-400 border border-blue-500/30 group-hover:scale-110 transition-transform">
            <Sparkles size={16} />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none">Judges Demo Mode</div>
            <div className="text-xs font-bold text-white mt-0.5">1-Click Presentation Console</div>
          </div>
          <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold uppercase font-mono">
            Tour
          </span>
        </button>
      ) : (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <Award size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Judge Presentation Flow</h3>
                <span className="text-[9px] font-semibold text-slate-400">Karnataka State Police CrimeLens AI</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-mono">
                {currentStep + 1} / {steps.length}
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Current step card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">{current.title}</h4>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800 text-[10px] font-bold text-blue-400">
              <Cpu size={12} className="shrink-0 text-blue-400" />
              <span className="truncate">{current.engine}</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-semibold bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {current.summary}
            </p>
          </div>

          {/* Action controls */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={handlePrevStep}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Back
            </button>

            <button
              onClick={handleNextStep}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{current.actionLabel}</span>
              <ChevronRight size={14} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
