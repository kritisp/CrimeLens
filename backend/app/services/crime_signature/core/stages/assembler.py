"""
CrimeLens AI — Pipeline Assembler Stage

Aggregates all extracted feature sets from the pipeline state and compiles
them into the final canonical, immutable CrimeSignature domain model.
"""

from __future__ import annotations

from typing import Union

from app.domain.models.signature import CrimeSignature, DerivedFeatures
from app.services.crime_signature.core.exceptions import PipelineAssemblyError
from app.services.crime_signature.core.interfaces import PipelineStage
from app.services.crime_signature.core.pipeline import PipelineContext


class CrimeSignatureAssembler(PipelineStage):
    """
    Validates that all intermediate features were generated and builds
    the final consolidated CrimeSignature object.
    """

    def process(
        self,
        context: Union[PipelineContext, CrimeSignature],
    ) -> Union[PipelineContext, CrimeSignature]:
        if isinstance(context, CrimeSignature):
            return context

        # 1. Assert all feature blocks are present in context
        if context.structured is None:
            raise PipelineAssemblyError("Structured features block is missing in context.")
        if context.temporal is None:
            raise PipelineAssemblyError("Temporal features block is missing in context.")
        if context.spatial is None:
            raise PipelineAssemblyError("Spatial features block is missing in context.")
        if context.text is None:
            raise PipelineAssemblyError("Text features block is missing in context.")
        if context.behavioral is None:
            raise PipelineAssemblyError("Behavioral features block is missing in context.")

        case = context.case

        # 2. Construct DerivedFeatures from raw case properties
        incident_duration = 0
        if case.incident_date_to:
            duration_delta = case.incident_date_to - case.incident_date_from
            incident_duration = max(0, int(duration_delta.total_seconds() / 60))

        derived = DerivedFeatures(
            reporting_delay_minutes=case.reporting_delay_minutes,
            incident_duration_minutes=incident_duration,
            accused_count=len(case.accused_list),
            victim_count=len(case.victims),
        )

        # 3. Assemble and return the final immutable CrimeSignature
        return CrimeSignature(
            crime_no=case.crime_no,
            case_master_id=case.case_master_id,
            structured=context.structured,
            temporal=context.temporal,
            spatial=context.spatial,
            text=context.text,
            derived=derived,
            behavioral=context.behavioral,
        )

