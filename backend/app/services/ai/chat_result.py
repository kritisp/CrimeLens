from dataclasses import dataclass


@dataclass(frozen=True)
class ChatResult:
    message: str
    is_complete: bool
    language: str
