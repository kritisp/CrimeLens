import { Bot, User, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import type { ChatMessage } from "../../types/chat";
import { InteractiveResponse } from "./InteractiveResponse";

interface MessageBubbleProps {
  message: ChatMessage;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export function MessageBubble({ message, onSpeak, isSpeaking }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [speakingLocal, setSpeakingLocal] = useState(false);

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) return;
    if (speakingLocal || isSpeaking) {
      window.speechSynthesis.cancel();
      setSpeakingLocal(false);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = message.content.replace(/[*_#`~]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "en-IN";
      utterance.onstart = () => setSpeakingLocal(true);
      utterance.onend = () => setSpeakingLocal(false);
      utterance.onerror = () => setSpeakingLocal(false);
      window.speechSynthesis.speak(utterance);
      onSpeak?.(message.content);
    }
  };

  return (
    <div
      className={`flex gap-3 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? "bg-gradient-to-br from-cyan-accent to-cyan-glow text-navy-950"
            : "border border-cyan-accent/20 bg-cyan-accent/10 text-cyan-accent"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      <div
        className={`flex max-w-[80%] flex-col sm:max-w-[70%] ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`relative group rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-md bg-gradient-to-br from-cyan-accent to-cyan-glow text-navy-950"
              : "rounded-tl-md border border-white/10 bg-white/[0.06] text-slate-200"
          }`}
        >
          <div>{message.content}</div>
          {!isUser && message.data && <InteractiveResponse data={message.data} />}

          {!isUser && (
            <button
              type="button"
              onClick={handleSpeak}
              title={speakingLocal ? "Stop Voice Playback" : "Listen to Response (TTS)"}
              className={`absolute top-2 right-2 p-1 rounded-lg transition-all ${
                speakingLocal
                  ? "bg-cyan-accent/20 text-cyan-accent animate-pulse"
                  : "opacity-40 group-hover:opacity-100 hover:bg-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {speakingLocal ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
        <span className="mt-1.5 px-1 text-[10px] text-slate-500">
          {isUser ? "Officer" : "AI Assistant"} · {message.timestamp}
        </span>
      </div>
    </div>
  );
}
