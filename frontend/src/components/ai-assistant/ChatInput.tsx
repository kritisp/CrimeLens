import { Mic, Paperclip, Send } from "lucide-react";
import { FormEvent, KeyboardEvent, useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Describe your incident or reply to the assistant...",
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-white/10 bg-navy-900/80 p-4 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
        <div className="glass flex items-end gap-2 rounded-2xl p-2 shadow-card">
          <button
            type="button"
            disabled
            title="File attachments will be enabled in a future release."
            aria-label="Attach file"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder={placeholder}
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
          />

          <button
            type="button"
            disabled
            title="Voice input will be enabled in a future release."
            aria-label="Voice input"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Mic className="h-5 w-5" />
          </button>

          <button
            type="submit"
            disabled={!value.trim() || disabled}
            title={disabled ? "Waiting for AI response..." : "Send message"}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent to-cyan-glow text-navy-950 transition-all duration-300 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-600">
          AI Assistant collects FIR details only. In emergencies, call 112.
        </p>
      </form>
    </div>
  );
}
