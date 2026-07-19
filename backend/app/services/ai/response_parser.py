import json
import re

from app.core.exceptions import AIProviderError

FIR_STATUS_PATTERN = re.compile(
    r"\[FIR_STATUS:\s*(complete|incomplete)\]\s*$",
    re.IGNORECASE,
)

COMPLETION_PHRASE = "you may now generate your fir draft"
FINAL_FIR_LINE = "fir successfully prepared for review and submission."
COMPLETION_JSON_KEYS = {
    "crime_type",
    "incident_summary",
    "date_time",
    "location",
    "complainant_details",
    "suspect_details",
    "evidence",
    "final_fir_draft",
}


def _extract_json_object(text: str) -> dict[str, str] | None:
    stripped = text.strip()

    if stripped.startswith("```"):
        stripped = re.sub(r"^```(?:json)?\s*", "", stripped)
        stripped = re.sub(r"\s*```$", "", stripped)

    try:
        payload = json.loads(stripped)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", stripped)
        if not match:
            return None
        try:
            payload = json.loads(match.group(0))
        except json.JSONDecodeError:
            return None

    if not isinstance(payload, dict):
        return None

    if not COMPLETION_JSON_KEYS.issubset(set(payload.keys())):
        return None

    return {key: str(payload.get(key, "")).strip() for key in COMPLETION_JSON_KEYS}


def _is_completion_json(text: str) -> bool:
    return _extract_json_object(text) is not None


def parse_assistant_response(raw: str) -> tuple[str, bool]:
    text = raw.strip()
    is_complete = False

    match = FIR_STATUS_PATTERN.search(text)
    if match:
        is_complete = match.group(1).lower() == "complete"
        text = FIR_STATUS_PATTERN.sub("", text).strip()
    elif COMPLETION_PHRASE in text.lower():
        is_complete = True
    elif FINAL_FIR_LINE in text.lower():
        is_complete = True
    elif _is_completion_json(text):
        is_complete = True

    return text, is_complete


def parse_draft_response(raw: str) -> dict[str, str]:
    draft = _extract_json_object(raw)
    if draft is None:
        raise AIProviderError(
            "AI returned an invalid FIR draft format. Please try again."
        )
    return draft
