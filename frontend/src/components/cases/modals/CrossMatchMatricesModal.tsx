import { useState } from "react";
import { X, Network, GitMerge, Check } from "lucide-react";
import { GlassCard } from "../../ui/GlassCard";

interface CrossMatchMatricesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCaseId: string;
  firNumber: string;
  onLinkCase: (matchedFir: string) => void;
}

const MATCHED_CASES = [
  {
    firNumber: "FIR-1002/2026",
    title: "Cyber Wallet Scam & UPI Phishing",
    similarity: 94,
    moMatch: "Keyless SIM clone & OTP interlink",
    location: "Koramangala, Zone 3",
    date: "2026-07-18",
    suspect: "Alias 'Bouncer' / Unknown syndicate",
    evidenceOverlap: "Phone IMEI match + IP Subnet 192.168.4.x",
    status: "Investigating",
  },
  {
    firNumber: "FIR-1005/2026",
    title: "Commercial Office Lock Bypass",
    similarity: 88,
    moMatch: "Nighttime 02:00 AM window entry",
    location: "Indiranagar 100ft Road",
    date: "2026-07-15",
    suspect: "Rohan 'Rony' Gupta",
    evidenceOverlap: "CCTV vehicle frame match (White SUV)",
    status: "Chargesheet Filed",
  },
  {
    firNumber: "FIR-1008/2026",
    title: "Motorcycle Relay Attack Theft",
    similarity: 81,
    moMatch: "Transponder frequency amplifier bypass",
    location: "HSR Layout Sector 1",
    date: "2026-07-12",
    suspect: "Unidentified local fencing ring",
    evidenceOverlap: "MO similarity & escape route match",
    status: "Under Review",
  },
  {
    firNumber: "FIR-1012/2026",
    title: "Bank ATM Snatching & Extortion",
    similarity: 74,
    moMatch: "Duress cash withdrawal pattern",
    location: "Jayanagar 4th Block",
    date: "2026-07-09",
    suspect: "Rajesh Kumar (Suspect)",
    evidenceOverlap: "Matching CDR tower cell handshake",
    status: "Investigating",
  },
];

export function CrossMatchMatricesModal({
  isOpen,
  onClose,
  currentCaseId: _currentCaseId,
  firNumber,
  onLinkCase,
}: CrossMatchMatricesModalProps) {
  const [selectedCase, setSelectedCase] = useState(MATCHED_CASES[0]);
  const [linkedCasesList, setLinkedCasesList] = useState<string[]>([]);
  const [justLinked, setJustLinked] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLinkAction = (matchedFir: string) => {
    onLinkCase(matchedFir);
    setLinkedCasesList((prev) => [...prev, matchedFir]);
    setJustLinked(matchedFir);
    setTimeout(() => setJustLinked(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <GlassCard className="w-full max-w-4xl border-cyan-500/30 bg-navy-950/95 shadow-glow p-6 space-y-6 relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-cyan-500/15 border border-cyan-400/30 text-cyan-accent flex items-center justify-center rounded-xl shadow-glow">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Automated Cross-Match Intelligence Matrices</h2>
              <p className="text-[11px] font-mono text-cyan-accent">Target FIR: {firNumber} • Scanned 1,240 Database FIRs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Matrix Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs shrink-0">
          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <span className="text-[9px] text-slate-500 uppercase font-bold block">Scanned FIR Corpus</span>
            <span className="text-white font-bold block mt-1">1,240 Active Records</span>
          </div>

          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <span className="text-[9px] text-slate-500 uppercase font-bold block">High Confidence Matches</span>
            <span className="text-cyan-accent font-bold block mt-1">4 Linked Cases</span>
          </div>

          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <span className="text-[9px] text-slate-500 uppercase font-bold block">Peak Similarity Score</span>
            <span className="text-emerald-400 font-bold block mt-1">94% Overlap</span>
          </div>

          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <span className="text-[9px] text-slate-500 uppercase font-bold block">Primary Vector Link</span>
            <span className="text-amber-300 font-bold block mt-1 truncate">MO & IMEI Hash</span>
          </div>
        </div>

        {/* Main Body: Matched List + Selected Detail */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-[260px] overflow-hidden">
          
          {/* Matched Cases List (Left 5 Cols) */}
          <div className="md:col-span-5 space-y-2 overflow-y-auto pr-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">
              Similarity Ranking:
            </span>
            {MATCHED_CASES.map((mc) => {
              const isSelected = selectedCase.firNumber === mc.firNumber;
              const isLinked = linkedCasesList.includes(mc.firNumber);
              return (
                <div
                  key={mc.firNumber}
                  onClick={() => setSelectedCase(mc)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? "border-cyan-accent bg-cyan-accent/10 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                      : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-xs font-bold text-cyan-accent">{mc.firNumber}</span>
                    <div className="flex items-center gap-1">
                      {isLinked && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          LINKED
                        </span>
                      )}
                      <span className="text-xs font-black text-emerald-400">{mc.similarity}%</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-white font-mono truncate">{mc.title}</p>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span>{mc.location}</span>
                    <span>{mc.date}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Matrix Breakdown (Right 7 Cols) */}
          <div className="md:col-span-7 bg-black/60 border border-white/10 rounded-xl p-4 space-y-4 overflow-y-auto font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold">Inspect Match Matrix</span>
                <h3 className="text-sm font-bold text-white uppercase mt-0.5">{selectedCase.firNumber}</h3>
              </div>
              <span className="text-xs font-black text-cyan-accent bg-cyan-accent/10 px-2.5 py-1 rounded-lg border border-cyan-accent/20">
                {selectedCase.similarity}% Similarity Index
              </span>
            </div>

            <div className="space-y-3 text-[11px]">
              <div>
                <span className="text-slate-500 uppercase font-bold block text-[9px]">Modus Operandi Match Pattern</span>
                <p className="text-slate-200 mt-0.5">{selectedCase.moMatch}</p>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-bold block text-[9px]">Forensic & Evidence Overlaps</span>
                <p className="text-cyan-accent mt-0.5">{selectedCase.evidenceOverlap}</p>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-bold block text-[9px]">Suspect & Syndicate Connection</span>
                <p className="text-rose-300 mt-0.5">{selectedCase.suspect}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-2 text-[10px]">
                <div>
                  <span className="text-slate-500">Incident Scene Location:</span>
                  <p className="text-slate-300">{selectedCase.location}</p>
                </div>
                <div>
                  <span className="text-slate-500">Occurrence Date:</span>
                  <p className="text-slate-300">{selectedCase.date}</p>
                </div>
              </div>
            </div>

            {justLinked === selectedCase.firNumber && (
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 animate-fade-in">
                <Check className="h-4 w-4 shrink-0" />
                <span>Case {selectedCase.firNumber} linked to active investigation dossier!</span>
              </div>
            )}

            <div className="border-t border-white/10 pt-3 flex justify-end">
              <button
                onClick={() => handleLinkAction(selectedCase.firNumber)}
                disabled={linkedCasesList.includes(selectedCase.firNumber)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase font-mono transition-all flex items-center gap-2 ${
                  linkedCasesList.includes(selectedCase.firNumber)
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default"
                    : "bg-cyan-accent text-navy-950 border border-cyan-accent hover:bg-cyan-300 shadow-glow"
                }`}
              >
                <GitMerge className="h-4 w-4" />
                {linkedCasesList.includes(selectedCase.firNumber) ? "Case Matrix Linked" : "Link Case to Investigation"}
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-white/10 pt-4 shrink-0 font-mono text-xs">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold uppercase hover:bg-white/10 transition-all"
          >
            Done Inspecting
          </button>
        </div>

      </GlassCard>
    </div>
  );
}
