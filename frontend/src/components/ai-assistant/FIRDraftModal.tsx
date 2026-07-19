import { Copy, Download, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import type { FIRDraftPayload } from "../../types/chat";
import { GlassCard } from "../ui/GlassCard";
import { serializeDraftForDownload } from "../../utils/firDraft";

interface FIRDraftModalProps {
  open: boolean;
  draft: FIRDraftPayload | null;
  onClose: () => void;
  onSave: (draft: FIRDraftPayload) => void;
}

export function FIRDraftModal({ open, draft, onClose, onSave }: FIRDraftModalProps) {
  const [editableDraft, setEditableDraft] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (open && draft) {
      setEditableDraft(draft.final_fir_draft);
    }
  }, [draft, open]);

  const canRender = open && draft;

  const previewLines = useMemo(
    () =>
      draft
        ? [
            ["Crime Type", draft.crime_type],
            ["Incident Summary", draft.incident_summary],
            ["Date & Time", draft.date_time],
            ["Location", draft.location],
            ["Complainant", draft.complainant_details],
            ["Suspect", draft.suspect_details],
            ["Evidence", draft.evidence],
          ]
        : [],
    [draft]
  );

  if (!canRender) return null;

  const handleCopy = async () => {
    if (!draft) return;
    await navigator.clipboard.writeText(
      serializeDraftForDownload({ ...draft, final_fir_draft: editableDraft })
    );
    setFeedback("Draft copied to clipboard.");
  };

  const handleDownload = () => {
    if (!draft) return;

    const pdf = new jsPDF();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("FIR Draft", 14, 18);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    let y = 30;
    const printableDraft = serializeDraftForDownload({
      ...draft,
      final_fir_draft: editableDraft,
    });

    previewLines.forEach(([label, value]) => {
      const lines = pdf.splitTextToSize(`${label}: ${value}`, 180);
      pdf.text(lines, 14, y);
      y += lines.length * 6 + 3;
    });

    y += 4;
    const bodyLines = pdf.splitTextToSize(printableDraft, 180);
    pdf.text(bodyLines, 14, y);
    pdf.save("fir-draft.pdf");
    setFeedback("PDF downloaded.");
  };

  const handleSave = async () => {
    if (!draft) return;
    onSave({ ...draft, final_fir_draft: editableDraft });
    
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const firNumber = `FIR/2026/${randomNum}`;
    
    try {
      const response = await fetch("/api/v1/intelligence/fir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firNumber,
          complainant: draft.complainant_details || "Unknown Complainant",
          offense: draft.incident_summary || "No Incident Summary Provided",
          station: draft.location || "Unknown Station",
          officer: "SI Ananya Reddy",
          status: "pending",
          priority: "medium",
          crimeCategory: draft.crime_type || "Other",
          severity: "medium"
        })
      });
      if (response.ok) {
        setFeedback(`Draft saved locally & synced to Command database. Assigned: ${firNumber}`);
      } else {
        setFeedback("Draft saved locally (Database sync offline).");
      }
    } catch {
      setFeedback("Draft saved locally (Connection offline).");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <GlassCard className="max-h-[90vh] w-full max-w-5xl overflow-hidden border-cyan-accent/20 bg-navy-900/95">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">FIR Draft</h2>
            <p className="text-xs text-slate-500">Review, edit, and export the generated FIR draft.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Close draft modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 overflow-y-auto p-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {previewLines.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                  <p className="mt-1 text-sm text-slate-200">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Draft Text</p>
              <textarea
                value={editableDraft}
                onChange={(e) => setEditableDraft(e.target.value)}
                rows={18}
                className="min-h-[320px] w-full resize-y rounded-xl border border-white/10 bg-navy-950/70 p-4 text-sm leading-relaxed text-slate-100 outline-none focus:border-cyan-accent/30"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</p>
              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-200 transition-colors hover:border-cyan-accent/20 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-200 transition-colors hover:border-cyan-accent/20 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center justify-center gap-2 rounded-xl border border-cyan-accent/30 bg-cyan-accent/10 px-4 py-2.5 text-sm font-medium text-cyan-accent transition-colors hover:bg-cyan-accent/20"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Draft Status</p>
              <p className="mt-2 text-sm text-slate-300">
                Saved drafts are kept locally in the browser for the current workstation.
              </p>
              {feedback && <p className="mt-2 text-sm text-emerald-400">{feedback}</p>}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
