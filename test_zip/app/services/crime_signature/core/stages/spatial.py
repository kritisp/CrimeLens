"""
CrimeLens AI — Pipeline Spatial Feature Stage

Encodes geographic coordinates into discrete spatial grid units (Geohash) and
assigns location classifications.
"""

from __future__ import annotations

from app.domain.models.signature import CrimeSignature, SpatialFeatures
from app.services.crime_signature.core.interfaces import PipelineStage
from app.services.crime_signature.core.pipeline import PipelineContext
from shared.geo.geohash import encode_geohash


class SpatialFeatureStage(PipelineStage):
    """
    Geohashes coordinates and resolves the operational zone class.
    """

    def process(
        self,
        context: Union[PipelineContext, CrimeSignature],
    ) -> Union[PipelineContext, CrimeSignature]:
        if isinstance(context, CrimeSignature):
            return context

        case = context.case
        lat, lon = case.latitude, case.longitude

        if lat is None or lon is None:
            spatial = SpatialFeatures(
                latitude=None,
                longitude=None,
                geohash_code="UNKNOWN",
                zone_classification="UNKNOWN",
            )
            return context.model_copy(update={"spatial": spatial})

        # Calculate Geohash code using shared utility
        geohash_code = encode_geohash(lat, lon, precision=7)

        # Simple coordinate-based zone classifier
        # Benchmark boundaries representing Bengaluru Metropolitan Area coordinates
        is_in_metro = (12.85 <= lat <= 13.15) and (77.45 <= lon <= 77.75)
        if is_in_metro:
            zone_classification = "URBAN METROPOLITAN"
        elif lat > 14.5:
            zone_classification = "NORTHERN JURISDICTION RURAL"
        else:
            zone_classification = "HIGHWAY CORRIDOR"

        spatial = SpatialFeatures(
            latitude=lat,
            longitude=lon,
            geohash_code=geohash_code,
            zone_classification=zone_classification,
        )

        return context.model_copy(update={"spatial": spatial})

