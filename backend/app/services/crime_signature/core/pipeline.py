"""
CrimeLens AI — Crime Signature Pipeline Manager

Houses the immutable PipelineState object and the CrimeSignaturePipeline
execution coordinator.
"""

from __future__ import annotations

import time
from typing import Dict, List, Optional, Tuple, Union

from pydantic import BaseModel, Field

from app.domain.models.ingested_case import IngestedCase
from app.domain.models.signature import (
    BehavioralFeatures,
    CrimeSignature,
    DerivedFeatures,
    SpatialFeatures,
    StructuredFeatures,
    TemporalFeatures,
    TextFeatures,
)
from app.services.crime_signature.core.exceptions import PipelineError
from app.services.crime_signature.core.interfaces import PipelineStage


class PipelineContext(BaseModel):
    """
    Immutable context passed between stages in the pipeline.
    Maintains intermediate features, metadata, timings, and warning lists.
    Uses Pydantic's frozen attribute to guarantee immutability.
    """

    case: IngestedCase = Field(..., description="The source case being processed.")
    normalized_facts: Optional[str] = Field(None, description="Normalized facts narrative.")
    structured: Optional[StructuredFeatures] = Field(None, description="Structured features block.")
    temporal: Optional[TemporalFeatures] = Field(None, description="Temporal features block.")
    spatial: Optional[SpatialFeatures] = Field(None, description="Spatial features block.")
    text: Optional[TextFeatures] = Field(None, description="Text features block.")
    derived: Optional[DerivedFeatures] = Field(None, description="Derived features block.")
    behavioral: Optional[BehavioralFeatures] = Field(None, description="Behavioral features block.")
    metadata: dict = Field(default_factory=dict, description="Custom metadata extension dictionary.")
    metrics: Dict[str, float] = Field(
        default_factory=dict,
        description="Execution timing logs for each pipeline stage in milliseconds.",
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="Non-blocking warning entries generated during stage execution.",
    )

    class Config:
        frozen = True


class CrimeSignaturePipeline:
    """
    Executes a sequence of registered PipelineStages.
    Provides support for adding/removing stages without altering execution code
    (Open-Closed Principle).
    """

    def __init__(self, stages: Optional[List[PipelineStage]] = None) -> None:
        self.stages: List[PipelineStage] = stages or []

    def add_stage(self, stage: PipelineStage) -> None:
        """Registers a new stage to the end of the pipeline execution chain."""
        self.stages.append(stage)

    def execute(self, case: IngestedCase) -> Tuple[CrimeSignature, PipelineContext]:
        """
        Runs the registered stages in sequence, collecting latency metrics for each step.
        
        Args:
            case: Input IngestedCase domain model.
            
        Returns:
            A tuple of (Assembled CrimeSignature, final PipelineContext).

        Raises:
            PipelineError: If a stage fails or the pipeline does not end with
                           a compiled CrimeSignature.
        """
        context: Union[PipelineContext, CrimeSignature] = PipelineContext(case=case)
        
        for stage in self.stages:
            if isinstance(context, CrimeSignature):
                # If a stage already returned the signature, we raise an error
                # because assembler should be the final stage of execution
                raise PipelineError(
                    f"Pipeline state was unexpectedly finalized before stage {stage.__class__.__name__}."
                )

            start_time = time.perf_counter()
            result = stage.process(context)
            duration_ms = (time.perf_counter() - start_time) * 1000.0

            # Collect timing metrics
            new_metrics = {**context.metrics, stage.__class__.__name__: round(duration_ms, 3)}

            if isinstance(result, CrimeSignature):
                # Update final metrics in context and return signature + context
                final_context = context.model_copy(update={"metrics": new_metrics})
                return result, final_context
            else:
                # Update context variables for the next stage
                context = result.model_copy(update={"metrics": new_metrics})
                
        raise PipelineError(
            "Pipeline execution did not yield a canonical CrimeSignature. "
            "Ensure CrimeSignatureAssembler is added as the final stage."
        )

