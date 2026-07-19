from pydantic import BaseModel, Field

from app.schemas.chat import ChatMessageSchema


class GenerateDraftRequest(BaseModel):
    messages: list[ChatMessageSchema] = Field(..., min_length=2, max_length=100)
    language: str = Field(default="en", min_length=2, max_length=10)


class FIRDraftSchema(BaseModel):
    crime_type: str
    incident_summary: str
    date_time: str
    location: str
    complainant_details: str
    suspect_details: str
    evidence: str
    final_fir_draft: str


class GenerateDraftResponse(BaseModel):
    draft: FIRDraftSchema
    message: str = "FIR draft generated successfully."
