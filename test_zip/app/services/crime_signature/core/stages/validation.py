"""
CrimeLens AI — Pipeline Validation Stage

Assures the integrity of the IngestedCase domain state before downstream feature
transformations are executed.
"""

from __future__ import annotations

from typing import Union

from app.domain.models.signature import CrimeSignature
from app.services.crime_signature.core.exceptions import PipelineValidationError
from app.services.crime_signature.core.interfaces import PipelineStage
from app.services.crime_signature.core.pipeline import PipelineContext


class ValidationStage(PipelineStage):
    """
    Validates structural requirements of an IngestedCase to ensure
    feature engineering stages can safely execute without key errors.
    """

    def process(
        self,
        context: Union[PipelineContext, CrimeSignature],
    ) -> Union[PipelineContext, CrimeSignature]:
        if isinstance(context, CrimeSignature):
            return context

        case = context.case

        # 1. Ensure raw facts / narrative has content to vectorize
        if not case.brief_facts or not case.brief_facts.strip():
            raise PipelineValidationError(
                "FIR brief_facts narrative is empty or contains only whitespace. "
                "Unable to generate semantic signature."
            )

        # 2. Check basic date alignments
        if case.incident_date_to and (case.incident_date_to < case.incident_date_from):
            raise PipelineValidationError(
                f"IncidentToDate ({case.incident_date_to}) cannot be earlier "
                f"than IncidentFromDate ({case.incident_date_from})."
            )

        # 3. Check reporting delay is not negative
        if case.info_received_ps_date < case.incident_date_from:
            raise PipelineValidationError(
                f"InfoReceivedPSDate ({case.info_received_ps_date}) cannot be earlier "
                f"than IncidentFromDate ({case.incident_date_from})."
            )

        return context

