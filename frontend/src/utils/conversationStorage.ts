import { initialConversations } from "../data/chatMockData";
import type { Conversation } from "../types/chat";

const STORAGE_KEY = "fir-chat-conversations";

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialConversations;

    const parsed = JSON.parse(raw) as Conversation[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return initialConversations;
    }

    return parsed;
  } catch {
    return initialConversations;
  }
}

export function saveConversations(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function clearConversationStorage() {
  localStorage.removeItem(STORAGE_KEY);
}
