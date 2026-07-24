from app.services.ai.prompts.en import FIR_SYSTEM_PROMPT_EN
from app.services.ai.prompts.hi import FIR_SYSTEM_PROMPT_HI

SUPPORTED_LANGUAGES: frozenset[str] = frozenset({"en", "hi"})

PROMPTS: dict[str, str] = {
    "en": FIR_SYSTEM_PROMPT_EN,
    "hi": FIR_SYSTEM_PROMPT_HI,
}


def normalize_language(language: str) -> str:
    code = language.strip().lower().split("-")[0]
    return code if code in SUPPORTED_LANGUAGES else "en"


def get_system_prompt(language: str) -> str:
    code = normalize_language(language)
    return PROMPTS[code]
