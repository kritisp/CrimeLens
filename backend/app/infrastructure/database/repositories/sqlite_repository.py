"""
CrimeLens AI — SQLite Repository

Concrete implementation of the FIRDataSource repository interface,
interacting with SQLAlchemy async sessions.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.domain.interfaces.data_source import FIRDataSource
from app.infrastructure.database.models import (
    DbCaseMaster,
    DbComplainant,
    DbVictim,
    DbAccused,
    DbActSection,
)


class SQLiteFIRRepository(FIRDataSource):
    """
    SQLAlchemy-backed async repository for raw FIR case management.
    """

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self._catalyst_repo = None
        
        try:
            import os
            # Prevent circular reference recursion by checking class inheritance
            from app.infrastructure.database.repositories.catalyst_repository import CatalystFIRRepository
            if not isinstance(self, CatalystFIRRepository):
                if "X_ZOHO_CATALYST_LISTEN_PORT" in os.environ or "PORT" in os.environ:
                    self._catalyst_repo = CatalystFIRRepository(session)
        except Exception:
            pass

    def _to_raw_dict(self, db_case: DbCaseMaster) -> Dict[str, Any]:
        """Maps a DbCaseMaster database model to a raw nested dictionary."""
        complainant_dict = None
        if db_case.complainant:
            complainant_dict = {
                "name": db_case.complainant.name,
                "age": db_case.complainant.age,
                "gender_id": db_case.complainant.gender_id,
                "occupation": db_case.complainant.occupation,
                "religion": db_case.complainant.religion,
                "caste": db_case.complainant.caste,
            }

        victims_list = []
        for vic in db_case.victims:
            victims_list.append({
                "name": vic.name,
                "age": vic.age,
                "gender_id": vic.gender_id,
                "is_police": vic.is_police,
            })

        accused_list = []
        for acc in db_case.accused_list:
            accused_list.append({
                "name": acc.name,
                "age": acc.age,
                "gender_id": acc.gender_id,
                "person_sequence": acc.person_sequence,
            })

        charges_list = []
        for charge in db_case.statutory_charges:
            charges_list.append({
                "act_code": charge.act_code,
                "section_code": charge.section_code,
            })

        return {
            "case_master_id": db_case.case_master_id,
            "crime_no": db_case.crime_no,
            "case_category": db_case.case_category,
            "gravity_offence": db_case.gravity_offence,
            "crime_major_head": db_case.crime_major_head,
            "crime_minor_head": db_case.crime_minor_head,
            "police_station_id": db_case.police_station_id,
            "incident_date_from": db_case.incident_date_from,
            "incident_date_to": db_case.incident_date_to,
            "info_received_ps_date": db_case.info_received_ps_date,
            "latitude": db_case.latitude,
            "longitude": db_case.longitude,
            "brief_facts": db_case.brief_facts,
            "complainant": complainant_dict,
            "victims": victims_list,
            "accused_list": accused_list,
            "statutory_charges": charges_list,
        }

    async def fetch_raw_fir(self, case_master_id: int) -> Dict[str, Any]:
        """Fetches raw FIR by ID."""
        if self._catalyst_repo and self._catalyst_repo.initialized:
            return await self._catalyst_repo.fetch_raw_fir(case_master_id)
        stmt = (
            select(DbCaseMaster)
            .where(DbCaseMaster.case_master_id == case_master_id)
            .options(
                selectinload(DbCaseMaster.complainant),
                selectinload(DbCaseMaster.victims),
                selectinload(DbCaseMaster.accused_list),
                selectinload(DbCaseMaster.statutory_charges),
            )
        )
        result = await self.session.execute(stmt)
        db_case = result.scalar_one_or_none()
        if not db_case:
            raise KeyError(f"Case ID {case_master_id} not found in database.")
        return self._to_raw_dict(db_case)

    async def fetch_raw_fir_by_crime_no(self, crime_no: str) -> Dict[str, Any]:
        """Fetches raw FIR by Crime Number string."""
        if self._catalyst_repo and self._catalyst_repo.initialized:
            return await self._catalyst_repo.fetch_raw_fir_by_crime_no(crime_no)
        stmt = (
            select(DbCaseMaster)
            .where(DbCaseMaster.crime_no == crime_no)
            .options(
                selectinload(DbCaseMaster.complainant),
                selectinload(DbCaseMaster.victims),
                selectinload(DbCaseMaster.accused_list),
                selectinload(DbCaseMaster.statutory_charges),
            )
        )
        result = await self.session.execute(stmt)
        db_case = result.scalar_one_or_none()
        if not db_case:
            raise KeyError(f"Crime Number {crime_no} not found in database.")
        return self._to_raw_dict(db_case)

    async def list_raw_firs(self) -> List[Dict[str, Any]]:
        """Retrieves all stored case records mapped as raw dictionaries."""
        if self._catalyst_repo and self._catalyst_repo.initialized:
            return await self._catalyst_repo.list_raw_firs()
        stmt = (
            select(DbCaseMaster)
            .options(
                selectinload(DbCaseMaster.complainant),
                selectinload(DbCaseMaster.victims),
                selectinload(DbCaseMaster.accused_list),
                selectinload(DbCaseMaster.statutory_charges),
            )
        )
        result = await self.session.execute(stmt)
        db_cases = result.scalars().all()
        return [self._to_raw_dict(c) for c in db_cases]

    async def store_raw_fir(self, case_data: Dict[str, Any]) -> int:
        """Saves a new case record mapping the nested structures to SQL tables."""
        if self._catalyst_repo and self._catalyst_repo.initialized:
            return await self._catalyst_repo.store_raw_fir(case_data)
        # Check if already exists to prevent duplicate key errors
        cid = case_data["case_master_id"]
        check_stmt = select(DbCaseMaster).where(DbCaseMaster.case_master_id == cid)
        check_res = await self.session.execute(check_stmt)
        existing = check_res.scalar_one_or_none()
        if existing:
            return cid

        db_case = DbCaseMaster(
            case_master_id=case_data["case_master_id"],
            crime_no=case_data["crime_no"],
            case_category=case_data["case_category"],
            gravity_offence=case_data["gravity_offence"],
            crime_major_head=case_data["crime_major_head"],
            crime_minor_head=case_data["crime_minor_head"],
            police_station_id=case_data["police_station_id"],
            incident_date_from=case_data["incident_date_from"],
            incident_date_to=case_data["incident_date_to"],
            info_received_ps_date=case_data["info_received_ps_date"],
            latitude=case_data.get("latitude"),
            longitude=case_data.get("longitude"),
            brief_facts=case_data["brief_facts"],
        )

        comp = case_data.get("complainant")
        if comp:
            db_case.complainant = DbComplainant(
                name=comp.get("name"),
                age=comp.get("age"),
                gender_id=comp.get("gender_id"),
                occupation=comp.get("occupation"),
                religion=comp.get("religion"),
                caste=comp.get("caste"),
            )

        for vic in case_data.get("victims", []):
            db_case.victims.append(
                DbVictim(
                    name=vic.get("name"),
                    age=vic.get("age"),
                    gender_id=vic.get("gender_id"),
                    is_police=vic.get("is_police", False),
                )
            )

        for acc in case_data.get("accused_list", []):
            db_case.accused_list.append(
                DbAccused(
                    name=acc.get("name"),
                    age=acc.get("age"),
                    gender_id=acc.get("gender_id"),
                    person_sequence=acc.get("person_sequence"),
                )
            )

        for charge in case_data.get("statutory_charges", []):
            db_case.statutory_charges.append(
                DbActSection(
                    act_code=charge["act_code"],
                    section_code=charge["section_code"],
                )
            )

        self.session.add(db_case)
        await self.session.flush()
        return cid
