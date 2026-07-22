import { Mic, MicOff, Paperclip, Send, Volume2, VolumeX, Square } from "lucide-react";
import { FormEvent, KeyboardEvent, useState, useEffect } from "react";
import { useVoiceAssistant } from "../../hooks/useVoiceAssistant";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoSpeak?: boolean;
  onToggleAutoSpeak?: () => void;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Describe your incident or reply to the assistant...",
  autoSpeak = false,
  onToggleAutoSpeak,
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const {
    isListening,
    transcript,
    recordingTime,
    startListening,
    stopListening,
  } = useVoiceAssistant({
    onTranscriptChange: (text) => {
      setValue(text);
    },
    onFinalTranscript: (text) => {
      if (text.trim()) {
        setValue(text);
      }
    },
  });

  // Sync transcript to input field as officer speaks
  useEffect(() => {
    if (transcript) {
      setValue(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!value.trim() || disabled) return;
    if (isListening) {
      stopListening();
    }
    onSend(value);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleMic = async () => {
    if (isListening) {
      const finalRecorded = await stopListening();
      if (finalRecorded.trim()) {
        setValue(finalRecorded);
      }
    } else {
      startListening();
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  return (
    <div className="border-t border-white/10 bg-navy-900/80 p-4 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-2">
        
        {/* Live Recording Indicator Overlay */}
        {isListening && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3.5 py-2 font-mono text-xs text-rose-300 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>Voice Recording Active... ({formatTime(recordingTime)})</span>
            </div>
            <button
              type="button"
              onClick={toggleMic}
              className="flex items-center gap-1 rounded bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-600"
            >
              <Square className="h-3 w-3 fill-current" /> Stop Listening
            </button>
          </div>
        )}

        <div className="glass flex items-end gap-2 rounded-2xl p-2 shadow-card">
          {onToggleAutoSpeak && (
            <button
              type="button"
              onClick={onToggleAutoSpeak}
              title={autoSpeak ? "Voice Auto-Speech ON (AI speaks responses)" : "Voice Auto-Speech OFF"}
              aria-label="Toggle Voice Auto-Speech"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                autoSpeak
                  ? "bg-cyan-accent/20 text-cyan-accent border border-cyan-accent/40 shadow-glow"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
              }`}
            >
              {autoSpeak ? <Volume2 className="h-5 w-5 animate-pulse" /> : <VolumeX className="h-5 w-5" />}
            </button>
          )}

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
            placeholder={isListening ? "Listening... Speak incident details..." : placeholder}
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50 font-mono"
          />

          <button
            type="button"
            onClick={toggleMic}
            title={isListening ? "Stop Voice Input" : "Click to Speak (Voice Assistant)"}
            aria-label="Voice input"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
              isListening
                ? "bg-rose-500 text-white shadow-glow animate-bounce"
                : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
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
        
        <p className="text-center text-[10px] text-slate-600 font-mono flex items-center justify-center gap-1.5">
          <span>Microphone active for hands-free voice transcription.</span>
          {autoSpeak && <span className="text-cyan-accent font-bold">🔊 Voice Responses Active</span>}
        </p>
      </form>
    </div>
  );
}
