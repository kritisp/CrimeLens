export interface ApiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatApiRequest {
  messages: ApiChatMessage[];
  language?: string;
}

export interface ChatApiResponse {
  message: string;
  role: "assistant";
  is_complete: boolean;
  language: string;
}

export interface ApiErrorBody {
  detail: unknown;
}
