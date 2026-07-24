"""
CrimeLens AI — Pipeline Normalization Stage

Cleans raw textual data to minimize linguistic noise before vector encoding.
"""

from __future__ import annotations

import re
from typing import Union

from app.domain.models.signature import CrimeSignature
from app.services.crime_signature.core.interfaces import PipelineStage
from app.services.crime_signature.core.pipeline import PipelineContext


class NormalizationStage(PipelineStage):
    """
    Standardizes whitespace, casing, and strips common police administrative
    boilerplate preambles from raw narrative text.
    """

    # Common prefixes / boilerplates to strip from narratives to focus on MO
    BOILERPLATE_PATTERNS = [
        r"^(the\s+)?complainant\s+appeared\s+before\s+(the\s+)?police\s+and\s+stated\s+that:?",
        r"^(the\s+)?complainant\s+states\s+that:?",
        r"^information\s+received\s+at\s+the\s+police\s+station\s+stating\s+that:?",
        r"^complaint\s+registered\s+stating\s+that:?",
    ]

    def process(
        self,
        context: Union[PipelineContext, CrimeSignature],
    ) -> Union[PipelineContext, CrimeSignature]:
        if isinstance(context, CrimeSignature):
            return context

        raw_facts = context.case.brief_facts

        # 1. Standardize spacing and normalize whitespace
        cleaned = re.sub(r"\s+", " ", raw_facts).strip()

        # 2. Case-insensitive stripping of boilerplate prefixes
        for pattern in self.BOILERPLATE_PATTERNS:
            match = re.match(pattern, cleaned, re.IGNORECASE)
            if match:
                cleaned = cleaned[match.end():].strip()
                break

        # 3. Capitalize the first letter for grammatical clean-up
        if cleaned:
            cleaned = cleaned[0].upper() + cleaned[1:]

        # Return a copy of the context with the normalized facts populated
        return context.model_copy(update={"normalized_facts": cleaned})

