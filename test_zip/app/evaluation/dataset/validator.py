"""
CrimeLens AI — Dataset Validator

Checks loaded cases for missing fields, duplicates, and boundary violations.
"""

from typing import List, Dict, Any
from app.domain.models.ingested_case import IngestedCase

class ValidationResult:
    def __init__(self):
        self.is_valid: bool = True
        self.errors: List[str] = []
        self.warnings: List[str] = []

class DatasetValidator:
    """Validates an entire dataset of IngestedCase objects."""

    def validate(self, dataset: List[IngestedCase]) -> ValidationResult:
        result = ValidationResult()
        seen_crime_nos = set()

        for idx, case in enumerate(dataset):
            # Duplicate check
            if case.crime_no in seen_crime_nos:
                result.errors.append(f"Duplicate crime_no found: {case.crime_no} at index {idx}.")
                result.is_valid = False
            seen_crime_nos.add(case.crime_no)

            # Missing fields (IngestedCase handles strict types, but we check semantics)
            if not case.brief_facts or len(case.brief_facts.strip()) < 10:
                result.warnings.append(f"Short or missing brief_facts for {case.crime_no}.")

            # Coordinate bounds (Karnataka approx bounding box already handled by Pydantic model)
            if case.latitude is None or case.longitude is None:
                result.warnings.append(f"Missing coordinates for {case.crime_no}.")

            # Legal sections
            if not case.statutory_charges:
                result.warnings.append(f"No statutory charges provided for {case.crime_no}.")

        if result.errors:
            result.is_valid = False

        return result
