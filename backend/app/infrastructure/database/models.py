"""
CrimeLens AI — Database Schema Models

Defines the SQLAlchemy ORM models mapped to sqlite/postgresql database tables.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.infrastructure.database.setup import Base


class DbCaseMaster(Base):
    """Database entity for CaseMaster records."""
    __tablename__ = "case_master"

    case_master_id = Column(Integer, primary_key=True, index=True)
    crime_no = Column(String(18), unique=True, index=True, nullable=False)
    case_category = Column(String(50), nullable=False)
    gravity_offence = Column(String(50), nullable=False)
    crime_major_head = Column(String(100), nullable=False)
    crime_minor_head = Column(String(100), nullable=False)
    police_station_id = Column(Integer, nullable=False)
    incident_date_from = Column(DateTime, nullable=False)
    incident_date_to = Column(DateTime, nullable=True)
    info_received_ps_date = Column(DateTime, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    brief_facts = Column(String, nullable=False)

    # Relationships
    complainant = relationship("DbComplainant", uselist=False, back_populates="case", cascade="all, delete-orphan")
    victims = relationship("DbVictim", back_populates="case", cascade="all, delete-orphan")
    accused_list = relationship("DbAccused", back_populates="case", cascade="all, delete-orphan")
    statutory_charges = relationship("DbActSection", back_populates="case", cascade="all, delete-orphan")


class DbComplainant(Base):
    """Database entity for Complainants."""
    __tablename__ = "complainant"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_master_id = Column(Integer, ForeignKey("case_master.case_master_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    gender_id = Column(Integer, nullable=True)
    occupation = Column(String(100), nullable=True)
    religion = Column(String(100), nullable=True)
    caste = Column(String(100), nullable=True)

    case = relationship("DbCaseMaster", back_populates="complainant")


class DbVictim(Base):
    """Database entity for Victims."""
    __tablename__ = "victim"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_master_id = Column(Integer, ForeignKey("case_master.case_master_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    gender_id = Column(Integer, nullable=True)
    is_police = Column(Boolean, default=False, nullable=False)

    case = relationship("DbCaseMaster", back_populates="victims")


class DbAccused(Base):
    """Database entity for Suspects."""
    __tablename__ = "accused"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_master_id = Column(Integer, ForeignKey("case_master.case_master_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    gender_id = Column(Integer, nullable=True)
    person_sequence = Column(String(10), nullable=True)

    case = relationship("DbCaseMaster", back_populates="accused_list")


class DbActSection(Base):
    """Database entity for Statutory Charges."""
    __tablename__ = "act_section"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_master_id = Column(Integer, ForeignKey("case_master.case_master_id", ondelete="CASCADE"), nullable=False)
    act_code = Column(String(50), nullable=False)
    section_code = Column(String(50), nullable=False)

    case = relationship("DbCaseMaster", back_populates="statutory_charges")
