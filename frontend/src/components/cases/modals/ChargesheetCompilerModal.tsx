import { useState } from "react";
import { X, Download, Copy, Check, Scale } from "lucide-react";
import { jsPDF } from "jspdf";
import { GlassCard } from "../../ui/GlassCard";

interface ChargesheetCompilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierData: any;
  onFileChargesheet: () => void;
}

export function ChargesheetCompilerModal({
  isOpen,
  onClose,
  dossierData,
  onFileChargesheet,
}: ChargesheetCompilerModalProps) {
  const [copied, setCopied] = useState(false);
  const [filed, setFiled] = useState(false);

  if (!isOpen || !dossierData) return null;

  const { overview, incident, suspect, evidence, legal } = dossierData;

  const courtName = "Metropolitan Magistrate Court, Bengaluru Urban District";
  const sectionCode = legal?.applicableSections?.join(", ") || "Section 303 BNS / Section 379 IPC (Theft)";

  const chargesheetContent = `
FINAL CHARGESHEET REPORT (U/S 173 Cr.P.C / BNS Section 193)
============================================================
IN THE COURT OF: ${courtName}
POLICE STATION: ${overview.policeStation || "Central Command PS"} | DISTRICT: ${overview.district || "Bengaluru"}
FIR NO: ${overview.firNumber} | DATE: ${overview.dateRegistered || "2026-07-21"}

1. ACCUSED PERSON(S) CHARGED:
   Name: ${suspect.name} (Alias: ${suspect.alias || "N/A"})
   Age/Gender: ${suspect.age} / ${suspect.gender}
   Custody Status: ${suspect.arrestStatus || "Under Investigation"} | Risk Index: ${suspect.riskLevel || "Medium"}

2. STATUTORY CHARGES & OFFENSES:
   Provisions Charged: ${sectionCode}
   Classification: ${overview.crimeCategory} - ${overview.crimeSubCategory}

3. BRIEF FACTS & INVESTIGATION FINDINGS:
   ${incident.originalNarrative || incident.description || "Complainant reported incident of theft under statutory jurisdiction."}

4. EVIDENCE LEDGER SUBMITTED TO COURT:
   ${evidence ? evidence.map((e: any) => `- [${e.id}] ${e.type}: ${e.description} (Lab Status: ${e.laboratoryStatus})`).join("\n   ") : "Forensic reports and site inspection map attached."}

5. INVESTIGATING OFFICER RECOMMENDATION:
   Prime facie evidence and witness corroboration establish guilty mind and act. Praying for cognizance under statutory law.

------------------------------------------------------------
INVESTIGATING OFFICER: ${overview.assignedOfficer}
SUPERVISING COMMANDER: ${overview.supervisingOfficer}
STATUS: CHARGESHEET PREPARED & VALIDATED
============================================================
`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(chargesheetContent.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("courier", "bold");
      doc.setFontSize(14);
      doc.text("POLICE DEPARTMENT - FINAL CHARGESHEET REPORT", 15, 18);
      doc.setFontSize(10);
      doc.text("(Under Section 173 Cr.P.C / BNS Section 193)", 15, 24);
      doc.line(15, 27, 195, 27);

      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(chargesheetContent.trim(), 180);
      doc.text(lines, 15, 34);

      doc.save(`Chargesheet_${overview.firNumber.replace(/\//g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      window.print();
    }
  };

  const handleFileAction = () => {
    onFileChargesheet();
    setFiled(true);
    setTimeout(() => {
      setFiled(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <GlassCard className="w-full max-w-3xl border-cyan-500/30 bg-navy-950/95 shadow-glow p-6 space-y-6 relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-cyan-500/15 border border-cyan-400/30 text-cyan-accent flex items-center justify-center rounded-xl shadow-glow">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Automated Chargesheet Compiler</h2>
              <p className="text-[11px] font-mono text-cyan-accent">Section 173 Cr.P.C / BNS 193 • {overview.firNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Legal Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs shrink-0">
          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <span className="text-[9px] text-slate-500 uppercase font-bold block">Target Court Jurisdiction</span>
            <span className="text-slate-200 font-bold block mt-1 truncate">{courtName}</span>
          </div>

          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <span className="text-[9px] text-slate-500 uppercase font-bold block">Statutory Charges</span>
            <span className="text-cyan-accent font-bold block mt-1 truncate">{sectionCode}</span>
          </div>

          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <span className="text-[9px] text-slate-500 uppercase font-bold block">Accused Offender</span>
            <span className="text-rose-400 font-bold block mt-1 truncate">{suspect.name}</span>
          </div>
        </div>

        {/* Chargesheet Preview Document */}
        <div className="flex-1 min-h-[220px] overflow-y-auto bg-black/70 border border-white/10 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-3 leading-relaxed">
          <div className="text-center border-b border-white/10 pb-3">
            <p className="text-sm font-bold text-white uppercase">IN THE COURT OF METROPOLITAN MAGISTRATE</p>
            <p className="text-[10px] text-cyan-accent uppercase mt-0.5">FINAL INVESTIGATION CHARGESHEET REPORT</p>
          </div>

          <div className="space-y-2 text-[11px]">
            <p><b className="text-slate-400">FIR NUMBER:</b> {overview.firNumber} | <b className="text-slate-400">DATE:</b> {overview.dateRegistered}</p>
            <p><b className="text-slate-400">POLICE STATION:</b> {overview.policeStation} | <b className="text-slate-400">INVESTIGATOR:</b> {overview.assignedOfficer}</p>
          </div>

          <div className="border-t border-white/10 pt-2 space-y-1">
            <p className="font-bold text-cyan-accent uppercase">1. ACCUSED DETAILS:</p>
            <p className="pl-4">• Name: {suspect.name} (Alias: {suspect.alias || "N/A"})</p>
            <p className="pl-4">• Custody/Bail: {suspect.arrestStatus} | Repeat Offender: {suspect.repeatOffender ? "YES" : "NO"}</p>
          </div>

          <div className="border-t border-white/10 pt-2 space-y-1">
            <p className="font-bold text-cyan-accent uppercase">2. CHARGES APPLIED:</p>
            <p className="pl-4">• {sectionCode}</p>
          </div>

          <div className="border-t border-white/10 pt-2 space-y-1">
            <p className="font-bold text-cyan-accent uppercase">3. FACTS & INVESTIGATION FINDINGS:</p>
            <p className="pl-4 text-slate-300 leading-normal">{incident.originalNarrative || incident.description}</p>
          </div>

          <div className="border-t border-white/10 pt-2 space-y-1">
            <p className="font-bold text-cyan-accent uppercase">4. EVIDENCE MATRIX:</p>
            {evidence && evidence.map((e: any) => (
              <p key={e.id} className="pl-4 text-slate-400">• [{e.id}] {e.type} — {e.description}</p>
            ))}
          </div>

          <div className="border-t border-white/10 pt-2 text-[10px] text-slate-500">
            [SECURE HASH]: 8F9A-412C-99B0-CHG-COMPILER-OK
          </div>
        </div>

        {/* Success Alert */}
        {filed && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 animate-fade-in shrink-0">
            <Check className="h-4 w-4 shrink-0" />
            <span>Chargesheet officially submitted to Court System! Investigation stage updated.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 shrink-0 font-mono text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold uppercase hover:bg-white/10 transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy Report"}
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-2 rounded-xl border border-cyan-accent/30 bg-cyan-accent/10 text-cyan-accent font-bold uppercase hover:bg-cyan-accent/20 transition-all flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold uppercase hover:bg-white/10 transition-all"
            >
              Close
            </button>
            <button
              onClick={handleFileAction}
              disabled={filed}
              className="px-5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500 text-navy-950 font-black uppercase hover:bg-emerald-400 transition-all shadow-glow flex items-center gap-2"
            >
              <Scale className="h-4 w-4" />
              File Chargesheet in Court
            </button>
          </div>
        </div>

      </GlassCard>
    </div>
  );
}
