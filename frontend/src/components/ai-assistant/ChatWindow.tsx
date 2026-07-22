import { Shield, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAutoScroll } from "../../hooks/useAutoScroll";
import type { Conversation } from "../../types/chat";
import { ChatInput } from "./ChatInput";
import { GenerateFIRDraftButton } from "./GenerateFIRDraftButton";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface ChatWindowProps {
  conversation: Conversation;
  isTyping: boolean;
  onSend: (message: string) => void;
  onGenerateFirDraft: () => void;
}

export function ChatWindow({
  conversation,
  isTyping,
  onSend,
  onGenerateFirDraft,
}: ChatWindowProps) {
  const scrollDep = `${conversation.id}-${conversation.messages.length}-${isTyping}`;
  const bottomRef = useAutoScroll(scrollDep);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const lastSpokenMsgIdRef = useRef<string | null>(null);

  // Auto-speak latest AI response if autoSpeak is enabled
  useEffect(() => {
    if (!autoSpeak || conversation.messages.length === 0) return;
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    if (
      lastMsg.role === "assistant" &&
      lastMsg.id !== lastSpokenMsgIdRef.current &&
      "speechSynthesis" in window
    ) {
      lastSpokenMsgIdRef.current = lastMsg.id;
      window.speechSynthesis.cancel();
      const cleanText = lastMsg.content.replace(/[*_#`~]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  }, [conversation.messages, autoSpeak]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/20 to-cyan-glow/10 text-cyan-accent">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">
              FIR Registration Assistant
            </h1>
            <p className="text-xs text-slate-500">
              {conversation.title} · AI-powered intake
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAutoSpeak((prev) => !prev)}
          title={autoSpeak ? "Voice Response ON" : "Voice Response OFF"}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-mono font-bold transition-all cursor-pointer ${
            autoSpeak
              ? "border-cyan-accent/40 bg-cyan-accent/15 text-cyan-accent shadow-glow"
              : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
          }`}
        >
          {autoSpeak ? (
            <>
              <Volume2 className="h-4 w-4 animate-pulse text-cyan-accent" />
              <span>Voice Auto-Speech ON</span>
            </>
          ) : (
            <>
              <VolumeX className="h-4 w-4" />
              <span>Voice Auto-Speech OFF</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {conversation.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
          {conversation.messages.length === 1 && !isTyping && (
            <div className="mt-4 p-4 mx-auto w-full max-w-2xl space-y-3 font-mono">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Suggested queries</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "Analyze vehicle theft patterns in East Division", query: "Analyze vehicle theft patterns in East Division" },
                  { label: "Show dossier on suspect Ravi 'Bouncer' Kumar", query: "Show intelligence dossier on suspect Ravi 'Bouncer' Kumar" },
                  { label: "Verify bank anomalies in Bidar case", query: "Verify bank transaction anomalies in Bidar case" }
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSend(sug.query)}
                    className="p-3 bg-white/[0.02] border border-white/10 hover:border-cyan-accent/30 rounded-2xl text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all flex items-center justify-between group shadow-sm cursor-pointer"
                  >
                    <span>{sug.label}</span>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-accent group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {(conversation.isComplete || conversation.messages.some((m) => m.role === "user")) && (
            <GenerateFIRDraftButton
              onClick={onGenerateFirDraft}
              disabled={isTyping}
              title={
                isTyping
                  ? "Generating FIR draft..."
                  : "Generate a professional FIR draft from this conversation"
              }
            />
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput
        onSend={onSend}
        disabled={isTyping}
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => setAutoSpeak((prev) => !prev)}
      />
    </div>
  );
}
