import { FileText, Sparkles } from "lucide-react";

interface GenerateFIRDraftButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}

export function GenerateFIRDraftButton({
  onClick,
  disabled = false,
  title,
}: GenerateFIRDraftButtonProps) {
  return (
    <div className="flex animate-fade-in justify-center px-4 py-3">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className="group flex items-center gap-2.5 rounded-xl border border-cyan-accent/30 bg-gradient-to-r from-cyan-accent/20 to-cyan-glow/10 px-6 py-3 text-sm font-semibold text-cyan-accent shadow-glow transition-all duration-300 hover:border-cyan-accent/50 hover:from-cyan-accent/30 hover:to-cyan-glow/20 hover:shadow-glow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FileText className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
        Generate FIR Draft
        <Sparkles className="h-4 w-4 opacity-60" />
      </button>
    </div>
  );
}
