"""
CrimeLens AI — Crime Signature Core ML Pipeline Framework

Exposes core pipeline classes, stages, exceptions, and instantiates default
pipeline configurations.
"""

from __future__ import annotations

from app.services.crime_signature.core.exceptions import (
    PipelineAssemblyError,
    PipelineError,
    PipelineValidationError,
)
from app.services.crime_signature.core.pipeline import (
    CrimeSignaturePipeline,
    PipelineContext,
)
from app.services.crime_signature.core.stages.assembler import CrimeSignatureAssembler
from app.services.crime_signature.core.stages.behavioral import BehavioralFeatureStage
from app.services.crime_signature.core.stages.normalization import NormalizationStage
from app.services.crime_signature.core.stages.spatial import SpatialFeatureStage
from app.services.crime_signature.core.stages.structured import StructuredFeatureStage
from app.services.crime_signature.core.stages.temporal import TemporalFeatureStage
from app.services.crime_signature.core.stages.text import TextFeatureStage
from app.services.crime_signature.core.stages.validation import ValidationStage


def create_default_pipeline() -> CrimeSignaturePipeline:
    """
    Creates and returns the canonical Crime Signature Pipeline loaded
    with the default sequence of feature engineering and validation stages.
    """
    return CrimeSignaturePipeline(
        [
            ValidationStage(),
            NormalizationStage(),
            StructuredFeatureStage(),
            TemporalFeatureStage(),
            SpatialFeatureStage(),
            BehavioralFeatureStage(),
            TextFeatureStage(),
            CrimeSignatureAssembler(),
        ]
    )
