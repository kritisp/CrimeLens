"""
CrimeLens AI — Embedding Model Lifecycle Manager

Coordinates model initialization, warmup, diagnostics, reloading, and unloading.
"""

from __future__ import annotations

import gc
import time
from typing import Any, Dict, Optional

import structlog

from app.services.crime_signature.embedding.exceptions import ModelLoadError
from app.services.crime_signature.embedding.interfaces import EmbeddingProvider

logger = structlog.get_logger("embedding_manager")


class EmbeddingManager:
    """
    Manages loading, warming up, health checking, and unloading model weights.
    Prevents memory leaks in containers.
    """

    def __init__(self, provider: EmbeddingProvider, config: Dict[str, Any]) -> None:
        self.provider = provider
        self.config = config
        self.model_name: str = config.get("model_name", "unnamed")
        self.is_loaded: bool = False
        self.is_healthy: bool = False
        self.last_state_change: float = time.time()

    def load(self) -> None:
        """Initializes provider weights and handles errors."""
        logger.info("Initializing embedding model weights.", model=self.model_name)
        start = time.perf_counter()
        try:
            self.provider.initialize(self.config)
            self.is_loaded = True
            self.last_state_change = time.time()
        except Exception as exc:
            self.is_healthy = False
            logger.error(
                "Failed to load embedding model weights.",
                model=self.model_name,
                error=str(exc),
            )
            raise ModelLoadError(f"Model initialization failed: {str(exc)}") from exc

        load_time_ms = (time.perf_counter() - start) * 1000.0
        logger.info(
            "Successfully loaded model weights.",
            model=self.model_name,
            load_time_ms=round(load_time_ms, 2),
        )

    def warmup(self) -> float:
        """Executes a dummy forward pass to warm up weights/tensors."""
        if not self.is_loaded:
            raise ModelLoadError("Model weights are not loaded. Warmup failed.")

        logger.info("Starting model execution warmup.", model=self.model_name)
        start = time.perf_counter()
        try:
            self.provider.embed_raw("Warmup initialization query facts")
            self.is_healthy = True
        except Exception as exc:
            self.is_healthy = False
            logger.error("Warmup execution cycle failed.", model=self.model_name, error=str(exc))
            raise ModelLoadError(f"Model warmup failed: {str(exc)}") from exc

        warmup_ms = (time.perf_counter() - start) * 1000.0
        logger.info(
            "Model warmup complete.",
            model=self.model_name,
            warmup_ms=round(warmup_ms, 2),
        )
        return warmup_ms

    def health_check(self) -> bool:
        """Verifies model loader viability and execution path correctness."""
        if not self.is_loaded:
            self.is_healthy = False
            return False

        try:
            res = self.provider.embed_raw("Health check probe text")
            self.is_healthy = len(res) > 0
        except Exception:
            self.is_healthy = False

        return self.is_healthy

    def unload(self) -> None:
        """Cleans local model memory footprints and runs garbage collector."""
        logger.info("Unloading model weights from memory.", model=self.model_name)
        if hasattr(self.provider, "_model"):
            self.provider._model = None

        # Clean cache references and invoke system garbage collection
        gc.collect()
        self.is_loaded = False
        self.is_healthy = False
        self.last_state_change = time.time()
        logger.info("Model weights unloaded successfully.", model=self.model_name)

    def reload(self) -> None:
        """Performs hot reload cycle."""
        self.unload()
        self.load()
        self.warmup()

    def shutdown(self) -> None:
        """Releases all model assets on orchestrator cleanup."""
        self.unload()
