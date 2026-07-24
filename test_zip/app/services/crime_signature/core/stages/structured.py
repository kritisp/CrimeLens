"""
CrimeLens AI — Pipeline Structured Feature Stage

Extracts and packages structured categorical features and statutory codes.
"""

from __future__ import annotations

from typing import Union

from app.domain.models.signature import CrimeSignature, StructuredFeatures
from app.services.crime_signature.core.interfaces import PipelineStage
from app.services.crime_signature.core.pipeline import PipelineContext


class StructuredFeatureStage(PipelineStage):
    """
    Extracts core statutory and categorical dimensions from the ingested case
    and formats them as a StructuredFeatures block.
    """

    def process(
        self,
        context: Union[PipelineContext, CrimeSignature],
    ) -> Union[PipelineContext, CrimeSignature]:
        if isinstance(context, CrimeSignature):
            return context

        case = context.case

        # Map list of ActSection models to string list representation (e.g. "IPC_379")
        statutory_charges = [
            f"{charge.act_code}_{charge.section_code}".upper().strip()
            for charge in case.statutory_charges
        ]

        structured = StructuredFeatures(
            case_category=case.case_category.strip().upper(),
            gravity_level=case.gravity_offence.strip().upper(),
            major_head=case.crime_major_head.strip().upper(),
            minor_head=case.crime_minor_head.strip().upper(),
            police_station_id=case.police_station_id,
            statutory_charges=sorted(list(set(statutory_charges))),
        )

        return context.model_copy(update={"structured": structured})

