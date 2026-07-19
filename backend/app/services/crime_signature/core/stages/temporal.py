"""
CrimeLens AI — Pipeline Temporal Feature Stage

Converts raw timestamps into cyclical representation coordinates (sine/cosine)
to preserve temporal proximity, and identifies holiday occurrences.
"""

from __future__ import annotations

import math
from typing import Union

from app.domain.models.signature import CrimeSignature, TemporalFeatures
from app.services.crime_signature.core.interfaces import PipelineStage
from app.services.crime_signature.core.pipeline import PipelineContext


class TemporalFeatureStage(PipelineStage):
    """
    Computes cyclical time representations and evaluates holiday status.
    """

    # Static list of major standard national gazetted holidays in India (MM-DD)
    NATIONAL_HOLIDAYS = {
        "01-26",  # Republic Day
        "08-15",  # Independence Day
        "10-02",  # Gandhi Jayanti
        "11-01",  # Karnataka Rajyotsava
    }

    def process(
        self,
        context: Union[PipelineContext, CrimeSignature],
    ) -> Union[PipelineContext, CrimeSignature]:
        if isinstance(context, CrimeSignature):
            return context

        case = context.case
        dt = case.incident_date_from

        # 1. Hour of day cyclical encoding (0-23)
        hour = dt.hour + (dt.minute / 60.0)
        hour_angle = 2.0 * math.pi * hour / 24.0
        hour_sin = math.sin(hour_angle)
        hour_cos = math.cos(hour_angle)

        # 2. Day of week cyclical encoding (0-6, where Monday=0)
        day_of_week = dt.weekday()
        day_angle = 2.0 * math.pi * day_of_week / 7.0
        day_sin = math.sin(day_angle)
        day_cos = math.cos(day_angle)

        # 3. Detect weekend/holiday status
        is_weekend = day_of_week in (5, 6)  # Saturday or Sunday
        date_str = dt.strftime("%m-%d")
        is_holiday = is_weekend or (date_str in self.NATIONAL_HOLIDAYS)

        temporal = TemporalFeatures(
            hour_sin=round(hour_sin, 6),
            hour_cos=round(hour_cos, 6),
            day_sin=round(day_sin, 6),
            day_cos=round(day_cos, 6),
            is_holiday=is_holiday,
        )

        return context.model_copy(update={"temporal": temporal})

