import { MessageSquare, Plus } from "lucide-react";
import type { Conversation } from "../../types/chat";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNewChat,
}: ConversationListProps) {
  return (
    <aside className="flex w-full flex-col border-r border-white/10 bg-navy-900/40 md:w-72 lg:w-80">
      <div className="border-b border-white/10 p-4">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-accent/30 bg-cyan-accent/10 px-4 py-2.5 text-sm font-medium text-cyan-accent transition-all duration-300 hover:border-cyan-accent/50 hover:bg-cyan-accent/20 hover:shadow-glow"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Previous Conversations
        </p>
        <div className="space-y-1">
          {conversations.map((convo) => {
            const isActive = convo.id === activeId;
            return (
              <button
                key={convo.id}
                type="button"
                onClick={() => onSelect(convo.id)}
                className={[
                  "group w-full rounded-xl px-3 py-3 text-left transition-all duration-300",
                  isActive
                    ? "border border-cyan-accent/20 bg-cyan-accent/10 shadow-glow"
                    : "border border-transparent hover:bg-white/[0.04]",
                ].join(" ")}
              >
                <div className="flex items-start gap-2.5">
                  <MessageSquare
                    className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? "text-cyan-accent" : "text-slate-500 group-hover:text-slate-300"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${isActive ? "text-white" : "text-slate-300"}`}
                    >
                      {convo.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {convo.preview}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] text-slate-600">
                        {convo.updatedAt}
                      </span>
                      {convo.isComplete && (
                        <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                          Complete
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
