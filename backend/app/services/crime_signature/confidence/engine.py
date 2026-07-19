"""
CrimeLens AI — Confidence Estimation Engine

Maintains confidence weight configurations and coordinates confidence calculators.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, Optional

import structlog
import yaml

from app.services.crime_signature.confidence.calculator import ConfidenceCalculator
from app.services.crime_signature.confidence.exceptions import ConfidenceConfigurationError
from app.services.crime_signature.confidence.models import ConfidenceFactors, ConfidenceResult

logger = structlog.get_logger("confidence_engine")


class ConfidenceEngine:
    """
    Coordinates weight configs loading, structures evidence factors, and runs
    calculations dynamically.
    """

    def __init__(self, config_path: Optional[str] = None) -> None:
        self.config_path = config_path or self._resolve_config_path()
        self.config = self._load_yaml_config()

        # Parse weights
        conf_cfg = self.config.get("confidence", {})
        self.weights: Dict[str, float] = conf_cfg.get(
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
        self._validate_weights()

        self.calculator = ConfidenceCalculator(weights=self.weights)

    def _resolve_config_path(self) -> str:
        """Looks up confidence configuration YAML in standard locations."""
        possible_paths = [
            Path("configs/confidence.yaml"),
            Path("backend/configs/confidence.yaml"),
            Path(__file__).resolve().parents[4] / "backend/configs/confidence.yaml",
            Path(__file__).resolve().parents[4] / "configs/confidence.yaml",
        ]

        for path in possible_paths:
            if path.exists() and path.is_file():
                return str(path.resolve())

        return "backend/configs/confidence.yaml"

    def _load_yaml_config(self) -> Dict[str, Any]:
        """Reads configurations from YAML."""
        if not os.path.exists(self.config_path):
            logger.warning(
                "Confidence configuration file not found, loading defaults.",
                config_path=self.config_path,
            )
            return {
                "confidence": {
                    "weights": {
                        "embedding": 0.45,
                        "crime_head": 0.10,
                        "crime_sub_head": 0.05,
                        "legal": 0.10,
                        "temporal": 0.10,
                        "spatial": 0.10,
                        "behavior": 0.10,
                    }
                }
            }

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        except Exception as exc:
            logger.error(
                "Failed to parse confidence yaml configuration.",
                config_path=self.config_path,
                error=str(exc),
            )
            raise

    def _validate_weights(self) -> None:
        """Asserts that weights sum up to approximately 1.0."""
        total = sum(self.weights.values())
        if not (0.95 <= total <= 1.05):
            raise ConfidenceConfigurationError(
                f"Confidence weights configuration error. "
                f"Weights must sum up to approximately 1.0 (got {total:.3f})."
            )

    def calculate_confidence(self, comparator_scores: Dict[str, float]) -> ConfidenceResult:
        """
        Structures scores mapping into ConfidenceFactors and runs calculation.

        Args:
            comparator_scores: Evaluated scores map from the Similarity Engine.

        Returns:
            The compiled ConfidenceResult containing the overall confidence.
        """
        factors = ConfidenceFactors(
            embedding=comparator_scores.get("embedding", 0.0),
            crime_head=comparator_scores.get("crime_head", 0.0),
            crime_sub_head=comparator_scores.get("crime_sub_head", 0.0),
            legal=comparator_scores.get("legal", 0.0),
            temporal=comparator_scores.get("temporal", 0.0),
            spatial=comparator_scores.get("spatial", 0.0),
            behavior=comparator_scores.get("behavior", 0.0),
        )

        result = self.calculator.calculate(factors)

        logger.info(
            "Confidence calculation complete.",
            overall_confidence=result.score,
        )

        return result
