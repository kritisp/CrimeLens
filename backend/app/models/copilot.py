import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class CopilotFile(Base):
    __tablename__ = "copilot_files"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("case_masters.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False) # image, pdf, audio, video, doc, zip
    file_size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    extracted_text = Column(String, nullable=True)
    summary = Column(String, nullable=True)
    confidence_score = Column(Integer, default=95, nullable=False)

    case = relationship("CaseMaster", backref="copilot_files")


class CopilotEntity(Base):
    __tablename__ = "copilot_entities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("case_masters.id", ondelete="CASCADE"), nullable=False)
    file_id = Column(String, ForeignKey("copilot_files.id", ondelete="CASCADE"), nullable=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False) # person, location, phone, vehicle, weapon, organization, date
    details = Column(String, nullable=True)
    confidence_score = Column(Integer, default=95, nullable=False)

    case = relationship("CaseMaster", backref="copilot_entities")
    file = relationship("CopilotFile", backref="entities")


class CopilotDraft(Base):
    __tablename__ = "copilot_drafts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("case_masters.id", ondelete="CASCADE"), nullable=False)
    draft_type = Column(String, nullable=False) # fir, statement, diary, memo, report
    title = Column(String, nullable=False)
    content = Column(String, nullable=False) # JSON-serialized
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    case = relationship("CaseMaster", backref="copilot_drafts")


class CopilotTimeline(Base):
    __tablename__ = "copilot_timelines"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("case_masters.id", ondelete="CASCADE"), nullable=False)
    timestamp_str = Column(String, nullable=False) # e.g. "8:32 PM"
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)

    case = relationship("CaseMaster", backref="copilot_timelines")
