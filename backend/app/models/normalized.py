import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class District(Base):
    """
    District model representing police districts.
    One District contains many Police Stations (Units).
    """
    __tablename__ = "districts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False, index=True)
    risk_score = Column(Integer, default=50, nullable=False)

    # Relationships
    stations = relationship("PoliceStation", back_populates="district", cascade="all, delete-orphan")


class PoliceStation(Base):
    """
    Police Station (Unit) model.
    One Station belongs to one District, has many Employees, and registers many Cases.
    """
    __tablename__ = "police_stations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False, index=True)
    district_id = Column(String, ForeignKey("districts.id", ondelete="CASCADE"), nullable=False)
    ward = Column(String, nullable=True)
    base_latitude = Column(Float, nullable=True)
    base_longitude = Column(Float, nullable=True)

    # Relationships
    district = relationship("District", back_populates="stations")
    employees = relationship("Employee", back_populates="station", cascade="all, delete-orphan")
    cases = relationship("CaseMaster", back_populates="station", cascade="all, delete-orphan")


class Employee(Base):
    """
    Employee (Police Officer) model.
    One Employee belongs to one Police Station and investigates many Cases.
    """
    __tablename__ = "employees"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    badge_number = Column(String, unique=True, nullable=False, index=True)
    rank = Column(String, default="SI", nullable=False)  # e.g., SI, Insp, Dy. SP
    station_id = Column(String, ForeignKey("police_stations.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="on-duty", nullable=False)  # on-duty, field, review, leave

    # Relationships
    station = relationship("PoliceStation", back_populates="employees")
    cases = relationship("CaseMaster", back_populates="officer")


class CrimeHead(Base):
    """
    Crime Category Head.
    One CrimeHead represents a broad category and has many SubHeads.
    """
    __tablename__ = "crime_heads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False, index=True)  # e.g., Theft, Cyber Crime

    # Relationships
    sub_heads = relationship("CrimeSubHead", back_populates="crime_head", cascade="all, delete-orphan")


class CrimeSubHead(Base):
    """
    Crime Sub-Category Head.
    Belongs to a CrimeHead and catalogs specific offenses mapped to CaseMasters.
    """
    __tablename__ = "crime_sub_heads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)  # e.g., UPI Scam, Motor Vehicle Theft
    crime_head_id = Column(String, ForeignKey("crime_heads.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    crime_head = relationship("CrimeHead", back_populates="sub_heads")
    cases = relationship("CaseMaster", back_populates="crime_sub_head")


class CaseMaster(Base):
    """
    Case Master model representing registered cases/FIRs.
    Links to a Station, Investigating Officer (Employee), Subhead, and has Complainants, Victims, Accused, and Chargesheets.
    """
    __tablename__ = "case_masters"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    fir_number = Column(String, unique=True, nullable=False, index=True)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String, default="pending", nullable=False)       # pending, investigating, solved, closed
    priority = Column(String, default="medium", nullable=False)      # low, medium, high, critical
    severity = Column(String, default="medium", nullable=False)      # low, medium, high, critical
    risk_score = Column(Integer, default=50, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    station_id = Column(String, ForeignKey("police_stations.id", ondelete="SET NULL"), nullable=True)
    employee_id = Column(String, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    crime_sub_head_id = Column(String, ForeignKey("crime_sub_heads.id", ondelete="SET NULL"), nullable=True)

    offense_description = Column(String, nullable=False)
    incident_summary = Column(String, nullable=True)
    evidence = Column(String, nullable=True)

    # Relationships
    station = relationship("PoliceStation", back_populates="cases")
    officer = relationship("Employee", back_populates="cases")
    crime_sub_head = relationship("CrimeSubHead", back_populates="cases")

    complainants = relationship("ComplainantDetails", back_populates="case_record", cascade="all, delete-orphan")
    victims = relationship("Victim", back_populates="case_record", cascade="all, delete-orphan")
    accused = relationship("Accused", back_populates="case_record", cascade="all, delete-orphan")
    chargesheet = relationship("ChargesheetDetails", uselist=False, back_populates="case_record", cascade="all, delete-orphan")


class ComplainantDetails(Base):
    """
    Complainant Details.
    Multiple Complainants can link to a single CaseMaster.
    """
    __tablename__ = "complainant_details"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("case_masters.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    details = Column(String, nullable=True)

    # Relationships
    case_record = relationship("CaseMaster", back_populates="complainants")


class Victim(Base):
    """
    Victim details linked to a CaseMaster.
    """
    __tablename__ = "victims"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("case_masters.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, index=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    contact = Column(String, nullable=True)
    details = Column(String, nullable=True)

    # Relationships
    case_record = relationship("CaseMaster", back_populates="victims")


class Accused(Base):
    """
    Accused details linked to a CaseMaster.
    """
    __tablename__ = "accused"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("case_masters.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, index=True)
    age = Column(Integer, nullable=True)
    description = Column(String, nullable=True)
    details = Column(String, nullable=True)

    # Relationships
    case_record = relationship("CaseMaster", back_populates="accused")


class ChargesheetDetails(Base):
    """
    Chargesheet filed for a completed CaseMaster.
    One CaseMaster has at most one ChargesheetDetails.
    """
    __tablename__ = "chargesheet_details"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("case_masters.id", ondelete="CASCADE"), nullable=False, unique=True)
    sections = Column(String, nullable=False)  # IPC Sections listed, e.g., "IPC Section 379"
    date_filed = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String, default="filed", nullable=False)  # filed, accepted, rejected
    details = Column(String, nullable=True)

    # Relationships
    case_record = relationship("CaseMaster", back_populates="chargesheet")
