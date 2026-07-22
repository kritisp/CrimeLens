import { useState } from "react";
import { X, UserCheck, Shield, Check } from "lucide-react";
import { GlassCard } from "../../ui/GlassCard";

interface ReassignCommanderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCommander: string;
  firNumber: string;
  onReassign: (newCommander: string, reason: string) => void;
}

const COMMANDER_ROSTER = [
  { id: "CMD-101", name: "Inspector Rajesh Varma", title: "Senior Crime Inspector", unit: "Central Command PS", activeCases: 4 },
  { id: "CMD-102", name: "Inspector Priya Sharma", title: "Cyber & Financial Crime Lead", unit: "Special Cell HQ", activeCases: 3 },
  { id: "CMD-103", name: "Inspector Ankit Mehta", title: "Special Task Force Officer", unit: "East Division PS", activeCases: 6 },
  { id: "CMD-104", name: "Inspector Vikram Rathore", title: "Homicide & Organized Crime Lead", unit: "Crime Branch Unit 4", activeCases: 2 },
  { id: "CMD-105", name: "Inspector Sunita Deshmukh", title: "Anti-Narcotics Division Lead", unit: "South Zone Command", activeCases: 5 },
];

const REASSIGNMENT_REASONS = [
  "Specialized Investigation Unit Transfer",
  "Workload & Case Volume Rebalancing",
  "Complex Multi-Jurisdiction Escalation",
  "Conflict of Interest Mitigation",
  "Administrative & Rotational Transfer",
];

export function ReassignCommanderModal({
  isOpen,
  onClose,
  currentCommander,
  firNumber,
  onReassign,
}: ReassignCommanderModalProps) {
  const [selectedCommander, setSelectedCommander] = useState(COMMANDER_ROSTER[0].name);
  const [selectedReason, setSelectedReason] = useState(REASSIGNMENT_REASONS[0]);
  const [notes, setNotes] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onReassign(selectedCommander, `${selectedReason}${notes ? ` - ${notes}` : ""}`);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <GlassCard className="w-full max-w-xl border-cyan-500/30 bg-navy-950/95 shadow-glow p-6 space-y-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-cyan-500/15 border border-cyan-400/30 text-cyan-accent flex items-center justify-center rounded-xl shadow-glow">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Re-assign Case Commander</h2>
              <p className="text-[11px] font-mono text-cyan-accent">Case FIR: {firNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Officer Info */}
        <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between font-mono text-xs">
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold block">Currently Assigned Officer</span>
            <span className="text-slate-200 font-bold">{currentCommander || "Inspector Rajesh Varma"}</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 uppercase font-bold">
            Active Lead
          </span>
        </div>

        {/* Commander Selection Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">
            Select New Lead Commander:
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {COMMANDER_ROSTER.map((cmd) => {
              const isSelected = selectedCommander === cmd.name;
              return (
                <div
                  key={cmd.id}
                  onClick={() => setSelectedCommander(cmd.name)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? "border-cyan-accent bg-cyan-accent/10 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                      : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                      isSelected ? "bg-cyan-accent text-navy-950" : "bg-white/10 text-slate-300"
                    }`}>
                      {cmd.id.split("-")[1]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white font-mono">{cmd.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{cmd.title} • {cmd.unit}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[9px] text-slate-500 block">Active Cases</span>
                    <span className="text-xs font-bold text-cyan-accent">{cmd.activeCases}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reason Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">
            Reassignment Category:
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-accent"
          >
            {REASSIGNMENT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">
            Authorization Notes / Directives (Optional):
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter supervisory remarks, case transfer protocols, or special instructions..."
            rows={2}
            className="w-full bg-navy-900 border border-white/10 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-accent resize-none"
          />
        </div>

        {/* Success Toast */}
        {isSuccess && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 animate-fade-in">
            <Check className="h-4 w-4 shrink-0" />
            <span>Case lead successfully transferred to {selectedCommander}!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-xs font-bold uppercase font-mono hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSuccess}
            className="px-5 py-2 rounded-xl border border-cyan-accent/40 bg-cyan-accent text-navy-950 text-xs font-black uppercase font-mono hover:bg-cyan-300 transition-all shadow-glow flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Confirm Re-assignment
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
