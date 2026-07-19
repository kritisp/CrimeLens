from functools import lru_cache

from app.core.exceptions import AIProviderError
from app.services.ai.base import AIService
from app.services.ai.chat_result import ChatResult
from app.services.ai.gemini_service import GeminiService, get_gemini_service
from app.services.ai.prompts import get_system_prompt, normalize_language
from app.services.ai.prompts.draft_en import FIR_DRAFT_PROMPT_EN
from app.services.ai.response_parser import parse_assistant_response, parse_draft_response


def _normalize_history(messages: list[dict[str, str]]) -> list[dict[str, str]]:
    return [
        {"role": message["role"], "content": message["content"].strip()}
        for message in messages
        if message.get("content", "").strip()
    ]


def _conversation_ready(messages: list[dict[str, str]]) -> bool:
    user_messages = [message for message in messages if message["role"] == "user"]
    return len(user_messages) >= 3 and len(messages) >= 4


class GeminiAIService(AIService):
    def __init__(self, service: GeminiService | None = None) -> None:
        self._service = service or get_gemini_service()

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        language: str = "en",
    ) -> ChatResult:
        normalized_language = normalize_language(language)
        normalized_messages = _normalize_history(messages)
        if not normalized_messages:
            raise AIProviderError("Conversation history is empty.")

        latest_message = normalized_messages[-1]["content"]
        history = normalized_messages[:-1]
        try:
            raw_reply = await self._service.chat(
                message=latest_message,
                system_prompt=get_system_prompt(normalized_language),
                history=history,
            )
        except RuntimeError as exc:
            raise AIProviderError(str(exc)) from exc

        message, is_complete = parse_assistant_response(raw_reply)
        return ChatResult(
            message=message,
            is_complete=is_complete,
            language=normalized_language,
        )

    async def generate_draft(
        self,
        messages: list[dict[str, str]],
        *,
        language: str = "en",
    ) -> dict[str, str]:
        normalized_language = normalize_language(language)
        normalized_messages = _normalize_history(messages)

        if not _conversation_ready(normalized_messages):
            raise AIProviderError(
                "Not enough information collected yet. Continue the conversation before generating a draft."
            )

        latest_message = (
            "Generate the complete FIR draft JSON from the conversation above."
        )
        try:
            raw_reply = await self._service.chat(
                message=latest_message,
                system_prompt=FIR_DRAFT_PROMPT_EN,
                history=normalized_messages,
            )
        except RuntimeError as exc:
            raise AIProviderError(str(exc)) from exc

        return parse_draft_response(raw_reply)


@lru_cache
def get_ai_service() -> AIService:
    return GeminiAIService()
