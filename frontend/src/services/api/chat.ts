import type {
  ApiErrorBody,
  ChatApiRequest,
  ChatApiResponse,
} from "./types";

const API_BASE = "/api/v1";

export class ChatApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
  }
}

function normalizeDetail(detail: unknown): string {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const obj = item as { msg?: unknown; loc?: unknown };
        const msg = typeof obj.msg === "string" ? obj.msg : null;
        if (!msg) return null;
        if (!Array.isArray(obj.loc)) return msg;
        const fieldPath = obj.loc
          .map((segment) => String(segment))
          .filter((segment) => segment !== "body")
          .join(".");
        return fieldPath ? `${fieldPath}: ${msg}` : msg;
      })
      .filter((value): value is string => Boolean(value));

    if (messages.length > 0) {
      return messages.join("; ");
    }
  }

  if (detail && typeof detail === "object") {
    return JSON.stringify(detail);
  }

  return "Unable to reach the AI assistant. Please try again.";
}

function detectLanguage(): string {
  return navigator.language?.split("-")[0]?.toLowerCase() || "en";
}

export async function sendChatMessage(
  messages: ChatApiRequest["messages"],
  language?: string
): Promise<ChatApiResponse & { stats?: any; timeline?: any; networkPreview?: any; heatmapPreview?: any; recommendations?: any; caseId?: any; actions?: any }> {


  const payload: ChatApiRequest = {
    messages,
    language: language ?? detectLanguage(),
  };

  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = "Unable to reach the AI assistant. Please try again.";
    try {
      const body = (await response.json()) as ApiErrorBody;
      detail = normalizeDetail(body.detail);
    } catch {
      // use default message
    }
    throw new ChatApiError(detail, response.status);
  }

  return response.json() as Promise<ChatApiResponse>;
}
