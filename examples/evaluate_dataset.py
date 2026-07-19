"""
CrimeLens AI — Evaluate Dataset Demo

Demonstrates the Dataset Loader, Validator, and Statistics modules.
"""

import os
import json
from datetime import datetime, timezone

from app.domain.models.ingested_case import IngestedCase, ActSection
from app.evaluation.dataset.validator import DatasetValidator
from app.evaluation.dataset.statistics import DatasetStatistics

def main():
    print("CrimeLens AI — Initializing Dataset Evaluation Demo...\n")

    # Mock dataset creation
    cases = [
        IngestedCase(
            case_master_id=101, crime_no="123456789012345678", case_category="FIR", gravity_offence="Heinous",
            crime_major_head="THEFT", crime_minor_head="MOTOR VEHICLE THEFT", police_station_id=1,
            incident_date_from=datetime(2023, 5, 1, 14, 0, tzinfo=timezone.utc), info_received_ps_date=datetime(2023, 5, 1, 16, 0, tzinfo=timezone.utc),
            latitude=12.9716, longitude=77.5946, brief_facts="Stolen vehicle.", statutory_charges=[ActSection(act_code="IPC", section_code="379")],
            victims=[], accused_list=[]
        ),
        IngestedCase(
            case_master_id=102, crime_no="223456789012345678", case_category="FIR", gravity_offence="Heinous",
            crime_major_head="THEFT", crime_minor_head="HOUSE BREAKING", police_station_id=1,
            incident_date_from=datetime(2023, 5, 2, 23, 0, tzinfo=timezone.utc), info_received_ps_date=datetime(2023, 5, 3, 1, 0, tzinfo=timezone.utc),
            latitude=None, longitude=None, brief_facts="House broken into.", statutory_charges=[ActSection(act_code="IPC", section_code="457")],
            victims=[], accused_list=[]
        ),
        IngestedCase(
            case_master_id=103, crime_no="123456789012345678", case_category="FIR", gravity_offence="Non-Heinous",
            crime_major_head="CHEATING", crime_minor_head="CYBER FRAUD", police_station_id=3,
            incident_date_from=datetime(2023, 5, 5, 10, 0, tzinfo=timezone.utc), info_received_ps_date=datetime(2023, 5, 6, 10, 0, tzinfo=timezone.utc),
            latitude=12.95, longitude=77.55, brief_facts="Short", statutory_charges=[],
            victims=[], accused_list=[]
        )
    ]

    validator = DatasetValidator()
    validation_result = validator.validate(cases)
    
    print("--- Validation Results ---")
    print(f"Is Valid: {validation_result.is_valid}")
    for err in validation_result.errors:
        print(f"[ERROR] {err}")
    for warn in validation_result.warnings:
        print(f"[WARNING] {warn}")
        
    print("\n--- Dataset Statistics ---")
    stats_engine = DatasetStatistics()
    stats = stats_engine.compute(cases)
    print(json.dumps(stats, indent=4))

if __name__ == "__main__":
    main()
