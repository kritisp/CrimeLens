import { useCallback, useEffect, useState } from "react";
import { ChatApiError, sendChatMessage } from "../services/api/chat";
import { generateFirDraft as requestFirDraft } from "../services/api/draft";
import {
  loadConversations,
  saveConversations,
} from "../utils/conversationStorage";
import type { ChatMessage, Conversation, FIRDraftPayload } from "../types/chat";

function createId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getTimestamp() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function createEmptyConversation(): Conversation {
  const id = createId();
  return {
    id,
    title: "New FIR Registration",
    preview: "Start describing your incident...",
    updatedAt: "Just now",
    isComplete: false,
    messages: [
      {
        id: createId(),
        role: "assistant",
        content:
          "Hello, I'm your FIR Registration Assistant. Please describe the incident you'd like to report, and I'll guide you through filing an FIR.",
        timestamp: getTimestamp(),
      },
    ],
  };
}

function toApiMessages(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export function useChatSession() {
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadConversations()
  );
  const [activeId, setActiveId] = useState(() => loadConversations()[0]?.id ?? "");
  const [isLoading, setIsLoading] = useState(false);

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? conversations[0];

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const startNewConversation = useCallback(() => {
    const newConvo = createEmptyConversation();
    setConversations((prev) => [newConvo, ...prev]);
    setActiveId(newConvo.id);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      const current = conversations.find((c) => c.id === activeId);
      if (!current) return;

      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
        timestamp: getTimestamp(),
      };

      const updatedMessages = [...current.messages, userMessage];

      setConversations((prev) =>
        prev.map((convo) =>
          convo.id === activeId
            ? {
                ...convo,
                messages: updatedMessages,
                preview: trimmed.slice(0, 60),
                updatedAt: "Just now",
                title:
                  convo.title === "New FIR Registration" &&
                  convo.messages.filter((m) => m.role === "user").length === 0
                    ? trimmed.slice(0, 40) + (trimmed.length > 40 ? "..." : "")
                    : convo.title,
              }
            : convo
        )
      );

      if (current.isComplete) return;

      setIsLoading(true);

      try {
        const response = await sendChatMessage(toApiMessages(updatedMessages));

        const aiMessage: ChatMessage = {
          id: createId(),
          role: "assistant",
          content: response.message,
          timestamp: getTimestamp(),
          data: response,
        };

        setConversations((prev) =>
          prev.map((convo) =>
            convo.id === activeId
              ? {
                  ...convo,
                  messages: [...updatedMessages, aiMessage],
                  preview: response.message.slice(0, 60),
                  isComplete: response.is_complete,
                }
              : convo
          )
        );
      } catch (error) {
        const detail =
          error instanceof ChatApiError
            ? error.message
            : "Something went wrong. Please try again.";

        const errorMessage: ChatMessage = {
          id: createId(),
          role: "assistant",
          content: detail,
          timestamp: getTimestamp(),
        };

        setConversations((prev) =>
          prev.map((convo) =>
            convo.id === activeId
              ? {
                  ...convo,
                  messages: [...updatedMessages, errorMessage],
                  preview: detail.slice(0, 60),
                }
              : convo
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeId, conversations, isLoading]
  );

  const generateFirDraft = useCallback(async (): Promise<FIRDraftPayload | null> => {
    if (isLoading) return null;

    const current = conversations.find((c) => c.id === activeId);
    if (!current?.isComplete) return null;

    setIsLoading(true);

    try {
      return await requestFirDraft(toApiMessages(current.messages));
    } catch (error) {
      const detail =
        error instanceof ChatApiError
          ? error.message
          : "Unable to generate FIR draft. Please try again.";

      const errorMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: detail,
        timestamp: getTimestamp(),
      };

      setConversations((prev) =>
        prev.map((convo) =>
          convo.id === activeId
            ? {
                ...convo,
                messages: [...convo.messages, errorMessage],
                preview: detail.slice(0, 60),
                updatedAt: "Just now",
              }
            : convo
        )
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [activeId, conversations, isLoading]);

  return {
    conversations,
    activeConversation,
    activeId,
    isTyping: isLoading,
    isLoading,
    selectConversation,
    startNewConversation,
    generateFirDraft,
    sendMessage,
  };
}
