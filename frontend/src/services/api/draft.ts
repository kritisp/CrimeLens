import type { ApiChatMessage, ApiErrorBody } from "./types";
import type { FIRDraftPayload } from "../../types/chat";
import { ChatApiError } from "./chat";

const API_BASE = "/api/v1";

function normalizeDetail(detail: unknown): string {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const obj = item as { msg?: unknown };
        return typeof obj.msg === "string" ? obj.msg : null;
      })
      .filter((value): value is string => Boolean(value));
    if (messages.length > 0) return messages.join("; ");
  }
  return "Unable to generate FIR draft. Please try again.";
}

export async function generateFirDraft(
  messages: ApiChatMessage[],
  language?: string
): Promise<FIRDraftPayload> {
  const response = await fetch(`${API_BASE}/chat/generate-draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      language: language ?? navigator.language?.split("-")[0]?.toLowerCase() ?? "en",
    }),
  });

  if (!response.ok) {
    let detail = "Unable to generate FIR draft. Please try again.";
    try {
      const body = (await response.json()) as ApiErrorBody;
      detail = normalizeDetail(body.detail);
    } catch {
      // use default
    }
    throw new ChatApiError(detail, response.status);
  }

  const body = (await response.json()) as { draft: FIRDraftPayload };
  return body.draft;
}
