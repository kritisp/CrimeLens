"""
CrimeLens AI — Pipeline Text Feature Stage

Packages the normalized narrative text into a TextFeatures model wrapper,
leaving the embedding slots blank (None) as reserved inputs.
"""

from __future__ import annotations

from typing import Union

from app.domain.models.signature import CrimeSignature, TextFeatures
from app.services.crime_signature.core.interfaces import PipelineStage
from app.services.crime_signature.core.pipeline import PipelineContext


class TextFeatureStage(PipelineStage):
    """
    Constructs the TextFeatures container from the normalized narrative facts.
    """

    def process(
        self,
        context: Union[PipelineContext, CrimeSignature],
    ) -> Union[PipelineContext, CrimeSignature]:
        if isinstance(context, CrimeSignature):
            return context

        facts = context.normalized_facts or context.case.brief_facts

        text_features = TextFeatures(
            narrative_summary=facts,
        )

        return context.model_copy(update={"text": text_features})

