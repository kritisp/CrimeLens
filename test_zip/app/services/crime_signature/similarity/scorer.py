"""
CrimeLens AI — Composite Similarity Scorer

Aggregates individual comparator scores using configurable weight mappings to produce
the final overall similarity score and detailed explanations.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from app.domain.models.signature import CrimeSignature
from app.services.crime_signature.similarity.comparators import (
    BehaviorComparator,
    CrimeHeadComparator,
    CrimeSubHeadComparator,
    EmbeddingComparator,
    LegalComparator,
    SpatialComparator,
    TemporalComparator,
)
from app.services.crime_signature.similarity.exceptions import ConfigurationError
from app.services.crime_signature.similarity.models import (
    SimilarityExplanation,
    SimilarityResult,
)


class CompositeSimilarityScorer:
    """
    Orchestrates the execution of feature comparators and computes the weighted
    aggregate score.
    """

    def __init__(self, weights: Dict[str, float]) -> None:
        self.weights = weights
        self._validate_weights()

    def _validate_weights(self) -> None:
        """Asserts that weights sum up to approximately 1.0."""
        total = sum(self.weights.values())
        if not (0.95 <= total <= 1.05):
            raise ConfigurationError(
                f"Similarity weights configuration error. "
                f"Weights must sum up to approximately 1.0 (got {total:.3f})."
            )

    def score(
        self,
        query: CrimeSignature,
        candidate: CrimeSignature,
        query_vector: Optional[List[float]] = None,
        candidate_vector: Optional[List[float]] = None,
    ) -> SimilarityResult:
        """
        Calculates composite similarity between query and candidate signatures.
        
        Args:
            query: Source query CrimeSignature.
            candidate: Candidate CrimeSignature.
            query_vector: Optional dense embedding float coordinates of query.
            candidate_vector: Optional dense embedding float coordinates of candidate.
            
        Returns:
            The SimilarityResult result wrapper.
        """
        # 1. Instantiate comparators
        comparators = {
            "embedding": EmbeddingComparator(query_vector, candidate_vector),
            "crime_head": CrimeHeadComparator(),
            "crime_sub_head": CrimeSubHeadComparator(),
            "legal": LegalComparator(),
            "temporal": TemporalComparator(),
            "spatial": SpatialComparator(),
            "behavior": BehaviorComparator(),
        }

        # 2. Run comparisons and gather rationales
        scores = {}
        explanations = {}
        matched_features = []

        for key, comparator in comparators.items():
            score, rationale = comparator.compare(query, candidate)
            scores[key] = round(score, 3)
            explanations[key] = rationale

            # If score indicates significant overlap, list as matched feature
            if score >= 0.7:
                matched_features.append(key.upper())

        # 3. Calculate weighted sum score
        overall_score = 0.0
        for key, weight in self.weights.items():
            overall_score += scores.get(key, 0.0) * weight

        # 4. Calculate overall confidence factor using the dynamic confidence engine
        from app.services.crime_signature.confidence import ConfidenceEngine
        try:
            confidence_engine = ConfidenceEngine()
            confidence_res = confidence_engine.calculate_confidence(scores)
            confidence = confidence_res.score
        except Exception:
            # Fallback if config is missing
            confidence = 1.0
            if query.spatial.geohash_code == "UNKNOWN" or candidate.spatial.geohash_code == "UNKNOWN":
                confidence = 0.8

        # 5. Compile rationale string
        rationale_items = []
        if "EMBEDDING" in matched_features:
            rationale_items.append("strong semantic text overlap")
        if "CRIME_HEAD" in matched_features:
            rationale_items.append("matching major category")
        if "LEGAL" in matched_features:
            rationale_items.append("shared statutory charges")
        if "BEHAVIOR" in matched_features:
            rationale_items.append("matching Modus Operandi tags")

        rationale = "Candidate crime matches query via " + ", ".join(rationale_items) if rationale_items else "Minor similarities detected across metadata blocks."

        explanation = SimilarityExplanation(
            rationale=rationale,
            comparator_explanations=explanations,
        )

        return SimilarityResult(
            case_id=candidate.case_master_id,
            overall_similarity=round(overall_score, 3),
            comparator_scores=scores,
            matched_features=matched_features,
            confidence=confidence,
            explanation=explanation,
        )

