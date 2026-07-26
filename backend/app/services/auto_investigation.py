import json
import logging
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.copilot import CopilotDraft
from app.services.ai.gemini_service import get_gemini_service
from app.infrastructure.database.repositories.sqlite_repository import SQLiteFIRRepository

logger = logging.getLogger(__name__)

async def run_auto_investigation(case_id: int, similar_cases_tags: List[str], db: AsyncSession):
    """
    Background task that executes the Auto-Investigation Engine.
    Retrieves focused context, calls Gemini, and saves the result to CopilotDraft.
    """
    logger.info(f"Starting auto-investigation for case {case_id}")
    try:
        # 1. Focused Retrieval
        repo = SQLiteFIRRepository(db)
        try:
            db_case = await repo.fetch_raw_fir(case_id)
        except Exception as e:
            logger.error(f"Auto-investigation failed: could not fetch case {case_id}: {e}")
            return
            
        facts = db_case.get("brief_facts", "No facts provided.")
        offense = db_case.get("crime_major_head", "Unknown Offense")
        
        # Format the optimized context block
        context_block = f"""
        CURRENT FIR DETAILS:
        FIR ID: {case_id}
        Offense: {offense}
        Gravity: {db_case.get("gravity_offence", "Unknown")}
        Narrative: {facts}
        Location Coordinates: {db_case.get("latitude")}, {db_case.get("longitude")}
        
        TOP SIMILAR FIRS (FAISS MATCHES):
        {", ".join(similar_cases_tags) if similar_cases_tags else "None"}
        
        LINKED ENTITIES:
        Suspects: {", ".join([acc.get("name") for acc in db_case.get("accused_list", [])]) if db_case.get("accused_list") else "None"}
        """

        # 2. Gemini Reasoning
        system_prompt = (
            "You are a Principal AI Investigation Copilot. Analyze the provided case context and generate a structured JSON investigation report. "
            "Do NOT include markdown formatting (like ```json), just return raw valid JSON. "
            "The JSON must have this exact structure: "
            '{"aiSummary": "A concise professional summary of the case and immediate threats.", '
            '"evidenceUsed": ["List of 3-4 bullet points of evidence/context used to reach this conclusion"], '
            '"recommendations": ["List of 3-4 actionable next steps for the investigating officer"], '
            '"confidenceScore": 85}'
        )
        
        gemini = get_gemini_service()
        response_text = await gemini.chat(
            message=f"Context:\n{context_block}\n\nPerform auto-investigation and return JSON.",
            system_prompt=system_prompt
        )
        
        # Attempt to parse JSON response
        try:
            # Strip markdown if Gemini accidentally included it
            clean_text = response_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
                
            investigation_result = json.loads(clean_text.strip())
        except json.JSONDecodeError:
            logger.error(f"Failed to parse Gemini response as JSON for case {case_id}. Raw: {response_text}")
            investigation_result = {
                "aiSummary": "AI service returned unstructured data. Please review the case manually.",
                "evidenceUsed": ["System fallback triggered"],
                "recommendations": ["Manual review required"],
                "confidenceScore": 0
            }
            
        if "AI service temporarily unavailable" in response_text:
            investigation_result = {
                "aiSummary": "AI service temporarily unavailable. Standard database retrieval completed.",
                "evidenceUsed": ["Database Index", "FAISS Similarity matches"],
                "recommendations": ["Review similar cases manually", "Standard operating procedure applies"],
                "confidenceScore": 0
            }
            
        # 3. Save to CopilotDraft
        draft = CopilotDraft(
            case_id=case_id,
            draft_type="auto_investigation",
            title="Auto-Investigation Report",
            content=json.dumps(investigation_result)
        )
        db.add(draft)
        await db.commit()
        logger.info(f"Auto-investigation completed successfully for case {case_id}")
        
    except Exception as e:
        logger.exception(f"Unhandled error in auto-investigation for case {case_id}: {e}")
        await db.rollback()
