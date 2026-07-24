"""
CrimeLens AI — Zoho Catalyst Repository Adapter

Implements the FIRDataSource contract targeting Zoho Catalyst Data Store
with an automatic SQLite fallback mechanism for resilient local development.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.repositories.sqlite_repository import SQLiteFIRRepository

logger = logging.getLogger(__name__)

class CatalystFIRRepository(SQLiteFIRRepository):
    """
    Decoupled repository adapter for Zoho Catalyst Data Store.
    Subclasses SQLiteFIRRepository to inherit the database session and SQL fallback
    queries directly, overriding the methods to execute cloud queries via the
    zcatalyst-sdk when initialized.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self.catalyst_app = None
        self.initialized = False

        # Attempt to dynamically initialize Zoho Catalyst SDK
        try:
            import zcatalyst_sdk
            # zcatalyst_sdk.initialize() returns the Catalyst App instance
            # and automatically reads platform environment variables in AppSail.
            self.catalyst_app = zcatalyst_sdk.initialize()
            self.initialized = True
            logger.info("Zoho Catalyst SDK initialized successfully within AppSail runtime.")
        except Exception as exc:
            self.initialized = False
            logger.debug(
                f"Catalyst SDK initialization skipped: {exc}. "
                "Resiliently falling back to SQLite database mode."
            )

    async def fetch_raw_fir(self, case_master_id: int) -> Dict[str, Any]:
        """Fetches raw FIR by ID from Catalyst Data Store or SQLite fallback."""
        if not self.initialized:
            return await super().fetch_raw_fir(case_master_id)

        try:
            # Execute ZCQL (Zoho Catalyst Query Language) query to fetch Case details
            zcql = self.catalyst_app.zcql()
            query = f"SELECT * FROM CaseMaster WHERE case_master_id = {case_master_id}"
            results = zcql.execute_query(query)
            
            if not results:
                raise KeyError(f"Case ID {case_master_id} not found in Catalyst Data Store.")

            row = results[0]["CaseMaster"]
            
            # Map the flat row structure from ZCQL to expected nested format
            db_case = {
                "case_master_id": int(row.get("case_master_id")),
                "crime_no": row.get("crime_no"),
                "case_category": row.get("case_category", "FIR"),
                "gravity_offence": row.get("gravity_offence", "Non-Heinous"),
                "crime_major_head": row.get("crime_major_head"),
                "crime_minor_head": row.get("crime_minor_head"),
                "police_station_id": int(row.get("police_station_id", 0)),
                "incident_date_from": row.get("incident_date_from"),
                "incident_date_to": row.get("incident_date_to"),
                "info_received_ps_date": row.get("info_received_ps_date"),
                "latitude": float(row.get("latitude")) if row.get("latitude") else None,
                "longitude": float(row.get("longitude")) if row.get("longitude") else None,
                "brief_facts": row.get("brief_facts"),
                "complainant": None,
                "victims": [],
                "accused_list": [],
                "statutory_charges": []
            }
            
            # Enrich Complainant details via ZCQL
            comp_query = f"SELECT * FROM Complainant WHERE case_id = {case_master_id}"
            comp_results = zcql.execute_query(comp_query)
            if comp_results:
                comp_row = comp_results[0]["Complainant"]
                db_case["complainant"] = {
                    "name": comp_row.get("name"),
                    "age": int(comp_row.get("age", 0)),
                    "gender_id": int(comp_row.get("gender_id", 1)),
                    "occupation": comp_row.get("occupation"),
                    "religion": comp_row.get("religion"),
                    "caste": comp_row.get("caste")
                }

            return db_case

        except Exception as exc:
            logger.warning(
                f"Catalyst Data Store fetch failed: {exc}. "
                "Executing fallback fetch from SQLite."
            )
            return await super().fetch_raw_fir(case_master_id)

    async def fetch_raw_fir_by_crime_no(self, crime_no: str) -> Dict[str, Any]:
        """Fetches raw FIR by Crime Number string."""
        if not self.initialized:
            return await super().fetch_raw_fir_by_crime_no(crime_no)

        try:
            zcql = self.catalyst_app.zcql()
            query = f"SELECT case_master_id FROM CaseMaster WHERE crime_no = '{crime_no}'"
            results = zcql.execute_query(query)
            if not results:
                raise KeyError(f"Crime Number {crime_no} not found in Catalyst Data Store.")
            
            case_id = int(results[0]["CaseMaster"]["case_master_id"])
            return await self.fetch_raw_fir(case_id)
        except Exception as exc:
            logger.warning(
                f"Catalyst Data Store fetch by crime_no failed: {exc}. "
                "Executing fallback query from SQLite."
            )
            return await super().fetch_raw_fir_by_crime_no(crime_no)

    async def list_raw_firs(self) -> List[Dict[str, Any]]:
        """Retrieves all stored case records."""
        if not self.initialized:
            return await super().list_raw_firs()

        try:
            zcql = self.catalyst_app.zcql()
            query = "SELECT case_master_id FROM CaseMaster"
            results = zcql.execute_query(query)
            
            cases = []
            for item in results:
                case_id = int(item["CaseMaster"]["case_master_id"])
                case_data = await self.fetch_raw_fir(case_id)
                cases.append(case_data)
            return cases
        except Exception as exc:
            logger.warning(
                f"Catalyst Data Store list failed: {exc}. "
                "Executing fallback list from SQLite."
            )
            return await super().list_raw_firs()

    async def store_raw_fir(self, case_data: Dict[str, Any]) -> int:
        """Saves a new case record mapping the nested structures to Catalyst Data Store."""
        # Always save to SQLite for local session tracking and hybrid resilience
        sqlite_id = await super().store_raw_fir(case_data)

        if not self.initialized:
            return sqlite_id

        try:
            datastore = self.catalyst_app.datastore()
            table = datastore.table("CaseMaster")
            
            row_data = {
                "case_master_id": case_data["case_master_id"],
                "crime_no": case_data["crime_no"],
                "case_category": case_data.get("case_category", "FIR"),
                "gravity_offence": case_data["gravity_offence"],
                "crime_major_head": case_data["crime_major_head"],
                "crime_minor_head": case_data["crime_minor_head"],
                "police_station_id": case_data["police_station_id"],
                "incident_date_from": str(case_data["incident_date_from"]),
                "incident_date_to": str(case_data["incident_date_to"]),
                "info_received_ps_date": str(case_data["info_received_ps_date"]),
                "latitude": case_data.get("latitude"),
                "longitude": case_data.get("longitude"),
                "brief_facts": case_data["brief_facts"]
            }

            table.insert_row(row_data)

            comp = case_data.get("complainant")
            if comp:
                comp_table = datastore.table("Complainant")
                comp_row = {
                    "case_id": case_data["case_master_id"],
                    "name": comp.get("name"),
                    "age": comp.get("age"),
                    "gender_id": comp.get("gender_id"),
                    "occupation": comp.get("occupation"),
                    "religion": comp.get("religion"),
                    "caste": comp.get("caste")
                }
                comp_table.insert_row(comp_row)

            logger.info(f"FIR {sqlite_id} successfully stored in Catalyst Data Store.")
        except Exception as exc:
            logger.warning(
                f"Catalyst Data Store write failed: {exc}. "
                "SQLite fallback was updated successfully."
            )

        return sqlite_id
