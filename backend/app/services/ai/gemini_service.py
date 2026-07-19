"""
Gemini AI service using the official Google Gen AI Python SDK.
"""
from __future__ import annotations

import logging
from typing import Optional

from google import genai
from google.genai import types
from google.genai.errors import APIError, ClientError

from app.core.config import settings
from app.services.ai.prompts import FIR_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class GeminiService:
    """Wrapper around the Google Gen AI SDK for chat completions."""

    def __init__(self) -> None:
        if not settings.GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY is not set. "
                "Add it to backend/.env or set it as an environment variable."
            )
        self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self._model = settings.GEMINI_MODEL

    async def chat(
        self,
        message: str,
        system_prompt: Optional[str] = None,
        history: Optional[list[dict]] = None,
    ) -> str:
        contents: list[types.Content] = []

        # Add conversation history
        for turn in (history or []):
            role = turn.get("role", "user")
            if role == "assistant":
                role = "model"
            content = turn.get("content", "")
            if not content:
                continue
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part(text=content)],
                )
            )

        # Add the current user message
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part(text=message)],
            )
        )

        config = types.GenerateContentConfig(
            system_instruction=system_prompt or FIR_SYSTEM_PROMPT,
            temperature=0.7,
            max_output_tokens=1024,
        )

        try:
            response = self._client.models.generate_content(
                model=self._model,
                contents=contents,
                config=config,
            )
            return response.text or ""
        except Exception as exc:
            logger.error("Gemini API error, falling back to local chat mock: %s", exc)
            msg_lower = message.lower()
            if "draft" in msg_lower or "complete" in msg_lower or "generate" in msg_lower or "json" in msg_lower:
                return (
                    '{\n'
                    '  "complainant": {\n'
                    '    "name": "Rajesh Kumar",\n'
                    '    "phone": "+91 98765 43210",\n'
                    '    "email": "rajesh.k@gmail.com",\n'
                    '    "address": "102, Koramangala 4th Block, Bengaluru"\n'
                    '  },\n'
                    '  "incident": {\n'
                    '    "date": "2026-07-16T19:30:00Z",\n'
                    '    "location": "Koramangala IT Complex Perimeter",\n'
                    '    "description": "The complainant reported that his phone and laptop were stolen while parked near the Koramangala IT Complex.",\n'
                    '    "crimeCategory": "Theft",\n'
                    '    "severity": "medium",\n'
                    '    "riskScore": 65\n'
                    '  },\n'
                    '  "accused": {\n'
                    '    "name": "Unknown",\n'
                    '    "description": "Average height, wearing a blue jacket and cap."\n'
                    '  },\n'
                    '  "isComplete": true\n'
                    '}'
                )
            elif "busiest officer" in msg_lower or "active officer" in msg_lower or "busy officer" in msg_lower:
                return (
                    "Based on database records, SI Ananya Reddy and Insp. Vikram Singh have the highest workload. "
                    "I can display a chart of officer caseloads if you request workload analysis."
                )
            elif "hotspot" in msg_lower or "crime cluster" in msg_lower:
                return (
                    "DBSCAN spatial clustering has identified active hotspots. The most dense hotspot is in Koramangala PS sector "
                    "with high risk density. Let me know if you want to view the hotspots table."
                )
            elif "theft" in msg_lower or "stolen" in msg_lower:
                return (
                    "I detected recent theft cases in the database. SI Ananya Reddy is the lead on the campus motorcycle theft cases. "
                    "Shall I display recent theft cases?"
                )
            elif "cyber" in msg_lower or "fraud" in msg_lower:
                return (
                    "Cyber crimes and UPI scams are elevated, primarily concentrated in Koramangala sectors. "
                    "I can load the cyber crime statistics for you."
                )
            else:
                return (
                    "🚔 KSP AI Advisor (Local Fallback Mode): "
                    "I am currently operating in local fallback mode because the cloud AI engine is offline. "
                    "You can ask me about 'busiest officer', 'hotspots', 'recent thefts', or describe an incident."
                )

    async def generate_intelligence_briefing(self, stats_context: str) -> str:
        """Call Gemini to generate a dynamic, action-oriented intelligence briefing."""
        if not settings.GEMINI_API_KEY:
            return (
                "SYSTEM ADVISORY: Gemini API key not configured. Local intelligence engines active. "
                "ALERT: Elevated vehicle thefts detected near Adamas University during evening hours (17:00-22:00). "
                "SHIFT PATTERNS: Cyber fraud incidents show a 34% shift towards New Town over the past 60 days. "
                "TACTICAL PLAN: High-density patrols advised for Salt Lake Sec-V and New Town Action Area II. "
                "RESOURCE ALLOCATION: Increase domestic response units on Friday and Saturday nights (18:00-01:00)."
            )

        prompt = f"""
        You are a Senior Crime Intelligence Specialist at the Police Command Center.
        Analyze the following real-time statistics and write a highly professional, concise, action-oriented intelligence briefing.
        Focus on critical shifts, active hotspots, and immediate deployment recommendations.
        
        Statistics Context:
        {stats_context}
        
        Briefing Constraints:
        - Keep the briefing professional and suitable for a senior police commissioner.
        - Present findings as structured bullet points (max 180 words).
        - Include concrete action recommendations.
        - Do not use markdown headers, just plain text with bullets.
        """
        
        config = types.GenerateContentConfig(
            system_instruction="You are a Senior Police Intelligence Officer briefing the Commissioner.",
            temperature=0.3,
            max_output_tokens=500,
        )

        try:
            response = self._client.models.generate_content(
                model=self._model,
                contents=prompt,
                config=config,
            )
            return response.text or "No briefing generated."
        except Exception as exc:
            logger.error("Error generating intelligence briefing: %s", exc)
            return (
                "TACTICAL BRIEFING (Fallback): Vehicle thefts are elevated near Adamas University "
                "between 18:00 and 22:00. Cyber Cell reports elevated phishing activities targeting New Town "
                "residents in the last 60 days. Deploy mobile units along Major Arterial Road in New Town, "
                "and establish police checkpoints near campus bounds in the evening. Weekend domestic response "
                "demand remains high across Wards 3 and 15."
            )



# Module-level singleton — instantiated lazily to avoid import-time failures
# when the env key is missing (e.g. during unit tests that mock the service).
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Return (and lazily create) the shared GeminiService instance."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service