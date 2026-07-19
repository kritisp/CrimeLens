import { Bot, User } from "lucide-react";
import type { ChatMessage } from "../../types/chat";
import { InteractiveResponse } from "./InteractiveResponse";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

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
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-md bg-gradient-to-br from-cyan-accent to-cyan-glow text-navy-950"
              : "rounded-tl-md border border-white/10 bg-white/[0.06] text-slate-200"
          }`}
        >
          <div>{message.content}</div>
          {!isUser && message.data && <InteractiveResponse data={message.data} />}
        </div>
        <span className="mt-1.5 px-1 text-[10px] text-slate-500">
          {isUser ? "Citizen" : "AI Assistant"} · {message.timestamp}
        </span>
      </div>
    </div>
  );
}
