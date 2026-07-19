import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Integer
from app.db.base import Base

class FIRModel(Base):
    """
    SQLAlchemy database model for First Information Reports (FIRs),
    extended to support Crime Intelligence & Geospatial Analytics.
    """
    __tablename__ = "firs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    fir_number = Column(String, unique=True, index=True, nullable=False)
    complainant = Column(String, nullable=False)
    offense = Column(String, nullable=False)
    station = Column(String, nullable=False)
    officer = Column(String, nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String, default="pending", nullable=False)      # pending, investigating, solved, closed
    priority = Column(String, default="medium", nullable=False)     # low, medium, high, critical

    # Geospatial and Intelligence extensions
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    district = Column(String, nullable=True)
    ward = Column(String, nullable=True)
    crime_category = Column(String, nullable=True)                  # e.g., Theft, Cyber Crime, Assault, etc.
    severity = Column(String, default="medium", nullable=True)       # low, medium, high, critical
    risk_score = Column(Integer, default=50, nullable=True)          # 0 to 100
