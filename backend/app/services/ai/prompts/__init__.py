from app.services.ai.prompts.registry import (
    SUPPORTED_LANGUAGES,
    get_system_prompt,
    normalize_language,
)
from app.services.ai.prompts.en import FIR_SYSTEM_PROMPT_EN as FIR_SYSTEM_PROMPT

__all__ = [
    "SUPPORTED_LANGUAGES",
    "get_system_prompt",
    "normalize_language",
    "FIR_SYSTEM_PROMPT",
]
