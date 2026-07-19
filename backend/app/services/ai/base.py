from abc import ABC, abstractmethod

from app.services.ai.chat_result import ChatResult


class AIService(ABC):
    """Abstract base for AI providers. Implement this to swap providers."""

    @abstractmethod
    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        language: str = "en",
    ) -> ChatResult:
        pass

    @abstractmethod
    async def generate_draft(
        self,
        messages: list[dict[str, str]],
        *,
        language: str = "en",
    ) -> dict[str, str]:
        pass
