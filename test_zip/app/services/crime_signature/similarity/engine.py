"""
CrimeLens AI — Hybrid Similarity Engine

Maintains configurations and coordinates second-stage weighted scoring,
similarity re-ranking, and threshold filters.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import structlog
import yaml

from app.domain.models.signature import CrimeSignature
from app.services.crime_signature.similarity.models import SimilarityResult
from app.services.crime_signature.similarity.scorer import CompositeSimilarityScorer

logger = structlog.get_logger("similarity_engine")


class SimilarityEngine:
    """
    Coordinates multi-feature comparators scoring, filters results below
    similarity thresholds, and re-ranks top matching candidates.
    """

    def __init__(self, config_path: Optional[str] = None) -> None:
        self.config_path = config_path or self._resolve_config_path()
        self.config = self._load_yaml_config()

        # Resolve similarity configurations
        sim_cfg = self.config.get("similarity", {})
        self.threshold: float = sim_cfg.get("threshold", 0.50)
        self.top_n: int = sim_cfg.get("top_n", 10)
        self.weights: Dict[str, float] = sim_cfg.get(
            "weights",
            {
                "embedding": 0.45,
                "crime_head": 0.10,
                "crime_sub_head": 0.05,
                "legal": 0.10,
                "temporal": 0.10,
                "spatial": 0.10,
                "behavior": 0.10,
            },
        )

        # Scorer instance
        self.scorer = CompositeSimilarityScorer(weights=self.weights)

    def _resolve_config_path(self) -> str:
        """Looks up similarity configurations in standard monorepo locations."""
        possible_paths = [
            Path("configs/similarity.yaml"),
            Path("backend/configs/similarity.yaml"),
            Path(__file__).resolve().parents[4] / "backend/configs/similarity.yaml",
            Path(__file__).resolve().parents[4] / "configs/similarity.yaml",
        ]

        for path in possible_paths:
            if path.exists() and path.is_file():
                return str(path.resolve())

        return "backend/configs/similarity.yaml"

    def _load_yaml_config(self) -> Dict[str, Any]:
        """Reads configurations from YAML."""
        if not os.path.exists(self.config_path):
            logger.warning(
                "Similarity configuration file not found, loading defaults.",
                config_path=self.config_path,
            )
            return {
                "similarity": {
                    "threshold": 0.50,
                    "top_n": 10,
                    "weights": {
                        "embedding": 0.45,
                        "crime_head": 0.10,
                        "crime_sub_head": 0.05,
                        "legal": 0.10,
                        "temporal": 0.10,
                        "spatial": 0.10,
                        "behavior": 0.10,
                    },
                }
            }

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        except Exception as exc:
            logger.error(
                "Failed to parse similarity yaml configuration.",
                config_path=self.config_path,
                error=str(exc),
            )
            raise

    def compute_similarity(
        self,
        query: CrimeSignature,
        candidates: List[CrimeSignature],
        query_vector: Optional[List[float]] = None,
        candidate_vectors: Optional[List[List[float]]] = None,
    ) -> List[SimilarityResult]:
        """
        Runs second-stage weighted similarity scoring and ranks top matches.

        Args:
            query: The query CrimeSignature.
            candidates: List of candidate CrimeSignatures.
            query_vector: Optional query embedding coordinates list.
            candidate_vectors: Optional candidate coordinates list of lists.

        Returns:
            Sorted list of SimilarityResult objects passing filters.
        """
        if not candidates:
            return []

        results = []
        for idx, candidate in enumerate(candidates):
            c_vector = candidate_vectors[idx] if candidate_vectors and idx < len(candidate_vectors) else None

            # Calculate composite similarity score
            res = self.scorer.score(
                query=query,
                candidate=candidate,
                query_vector=query_vector,
                candidate_vector=c_vector,
            )

            # Filter candidates below score threshold limits
            if res.overall_similarity >= self.threshold:
                results.append(res)

        # Sort candidate records by similarity scores (descending)
        results.sort(key=lambda x: x.overall_similarity, reverse=True)

        logger.info(
            "Hybrid similarity re-ranking complete.",
            candidates_scored=len(candidates),
            passing_threshold=len(results),
            threshold=self.threshold,
            top_n=self.top_n,
        )

        return results[:self.top_n]
