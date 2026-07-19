"""
CrimeLens AI — Embedding Orchestrator

Coordinates model registry configurations, lifecycle warming loops, pre/post-processing,
validation, and concurrency-safe in-memory caching.
"""

from __future__ import annotations

import hashlib
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import structlog
import yaml

from app.domain.models.signature import CrimeSignature
from app.services.crime_signature.embedding.cache import EmbeddingCache
from app.services.crime_signature.embedding.exceptions import (
    ModelNotFoundError,
)
from app.services.crime_signature.embedding.interfaces import EmbeddingProvider
from app.services.crime_signature.embedding.manager import EmbeddingManager
from app.services.crime_signature.embedding.models import (
    EmbeddingMetadata,
    EmbeddingResult,
    EmbeddingVersion,
)
from app.services.crime_signature.embedding.processors import (
    EmbeddingPostProcessor,
    EmbeddingPreprocessor,
    EmbeddingValidator,
)
from app.services.crime_signature.embedding.registry import ModelRegistry

logger = structlog.get_logger("embedding_orchestrator")


class EmbeddingOrchestrator:
    """
    Coordinates Preprocessing, inference via EmbeddingManager lifecycle hooks,
    Postprocessing normalization, and output validation before caching results.
    """

    def __init__(self, config_path: Optional[str] = None) -> None:
        self.config_path = config_path or self._resolve_config_path()
        self.config: Dict[str, Any] = self._load_yaml_config()
        
        # Resolve active model properties
        self.default_model_name: str = self.config.get("active_model", "minilm")
        
        # Instantiate cache with default size
        cache_max_size: int = self.config.get("cache_max_size", 1000)
        self.cache = EmbeddingCache(max_size=cache_max_size)
        
        # Model configuration map and lifecycle managers
        self._managers: Dict[str, EmbeddingManager] = {}
        self._initialize_model_managers(self.config.get("providers", {}))

    def _resolve_config_path(self) -> str:
        """Looks up the model registry configs in standard monorepo folder locations."""
        possible_paths = [
            Path("configs/models/registry.yaml"),
            Path("backend/configs/models/registry.yaml"),
            Path(__file__).resolve().parents[4] / "backend/configs/models/registry.yaml",
            Path(__file__).resolve().parents[4] / "configs/models/registry.yaml",
        ]
        
        for path in possible_paths:
            if path.exists() and path.is_file():
                return str(path.resolve())
                
        # Default fallback
        return "backend/configs/models/registry.yaml"

    def _load_yaml_config(self) -> Dict[str, Any]:
        """Reads configuration params from YAML file."""
        if not os.path.exists(self.config_path):
            logger.warning(
                "Embedding registry configuration file not found, loading defaults.",
                config_path=self.config_path,
            )
            return {
                "active_model": "minilm",
                "cache_max_size": 1000,
                "providers": {
                    "minilm": {
                        "model_name": "all-MiniLM-L6-v2",
                        "dimension": 384,
                        "provider_type": "sentence_transformers",
                        "prefix": "",
                        "normalize": True,
                        "mock_mode": True,
                        "model_version": "1.0.0",
                        "feature_version": "1.0.0",
                        "pipeline_version": "1.0.0",
                    }
                }
            }

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        except Exception as exc:
            logger.error(
                "Failed to parse embedding registry yaml configuration.",
                config_path=self.config_path,
                error=str(exc),
            )
            raise

    def _initialize_model_managers(self, providers_cfg: Dict[str, Any]) -> None:
        """Instantiates provider classes and registers them inside lifecycle managers."""
        for model_code, model_props in providers_cfg.items():
            provider_type = model_props.get("provider_type", "sentence_transformers")
            try:
                # Resolve provider class from registry
                provider_cls = ModelRegistry.get_provider_class(provider_type)
                provider_instance = provider_cls()
                
                # Bundle model profile configuration details
                init_props = {**model_props, "model_name": model_code}
                
                # Wrap strategy provider inside EmbeddingManager lifecycle coordinator
                manager = EmbeddingManager(provider_instance, init_props)
                self._managers[model_code.lower().strip()] = manager
                
                logger.info(
                    "Registered lifecycle manager for model strategy.",
                    model_code=model_code,
                    provider_type=provider_type,
                    dimension=model_props.get("dimension"),
                )
            except Exception as exc:
                logger.error(
                    "Failed to initialize lifecycle manager for model strategy.",
                    model_code=model_code,
                    provider_type=provider_type,
                    error=str(exc),
                )

    def get_embedding(
        self,
        signature: CrimeSignature,
        model_name: Optional[str] = None,
    ) -> EmbeddingResult:
        """
        Runs text through the Preprocessor, Provider, PostProcessor, and Validator pipeline.
        
        Args:
            signature: The CrimeSignature source object.
            model_name: Model lookup identifier, defaults to active_model.

        Returns:
            The final, validated EmbeddingResult vector payload.

        Raises:
            ModelNotFoundError: If requested model is not found in configurations.
        """
        target_model = (model_name or self.default_model_name).lower().strip()
        manager = self._managers.get(target_model)
        if not manager:
            raise ModelNotFoundError(
                f"Model '{target_model}' is not configured in ModelRegistry. "
                f"Available models: {list(self._managers.keys())}"
            )

        # 1. Lazy-load model weights and warm up if not already active
        if not manager.is_loaded:
            manager.load()
            manager.warmup()

        # 2. Hash computation for cache lookup
        serialized = signature.model_dump_json()
        raw_key = f"{target_model}:{serialized}"
        signature_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

        # 3. Cache Query
        cached_result = self.cache.get(signature_hash)
        if cached_result:
            logger.info(
                "Embedding retrieved from cache.",
                model=target_model,
                latency_ms=0.0,
                cache="HIT",
                dimension=cached_result.embedding_dimension,
                crime_no=signature.crime_no,
            )
            return cached_result

        # 4. Pipeline Execution
        start_time = time.perf_counter()

        # (a) PREPROCESS: Apply query-specific prefixes
        prefix_val = manager.config.get("prefix", "")
        preprocessor = EmbeddingPreprocessor(prefix=prefix_val)
        preprocessed_text = preprocessor.preprocess(signature.text.narrative_summary)

        # (b) INFERENCE: Run forward pass via provider
        raw_vector = manager.provider.embed_raw(preprocessed_text)

        # (c) POSTPROCESS: Apply L2 normalization
        normalize_val = manager.config.get("normalize", True)
        postprocessor = EmbeddingPostProcessor(normalize=normalize_val)
        processed_vector = postprocessor.postprocess(raw_vector)

        # (d) VALIDATE: Assert dimensions and absence of NaN/INF coordinates
        expected_dim = manager.config.get("dimension", 384)
        validator = EmbeddingValidator(expected_dimension=expected_dim)
        validator.validate(processed_vector)

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        version = EmbeddingVersion(
            model_version=manager.config.get("model_version", "1.0.0"),
            feature_version=manager.config.get("feature_version", "1.0.0"),
            pipeline_version=manager.config.get("pipeline_version", "1.0.0"),
        )

        result = EmbeddingResult(
            embedding_vector=processed_vector,
            model_name=target_model,
            embedding_dimension=expected_dim,
            embedding_version=version,
            inference_latency_ms=round(latency_ms, 3),
            generation_timestamp=datetime.now(timezone.utc),
            crime_signature_hash=signature_hash,
        )

        # 5. Cache Save
        self.cache.set(signature_hash, result)

        logger.info(
            "Embedding pipeline executed successfully.",
            model=target_model,
            latency_ms=result.inference_latency_ms,
            cache="MISS",
            dimension=result.embedding_dimension,
            crime_no=signature.crime_no,
        )

        return result

    def get_model_metadata(self, model_name: str) -> EmbeddingMetadata:
        """Gets static metadata describing target model configuration."""
        target_model = model_name.lower().strip()
        manager = self._managers.get(target_model)
        if not manager:
            raise ModelNotFoundError(f"Active model '{target_model}' not found.")
        if not manager.is_loaded:
            manager.load()
        return manager.provider.get_metadata()


    def get_performance_diagnostics(self) -> Dict[str, Any]:
        """Gathers cache statistics and memory estimates."""
        return {
            "cache_size": self.cache.size,
            "cache_max_size": self.cache.max_size,
            "cache_hits": self.cache.hits,
            "cache_misses": self.cache.misses,
            "cache_memory_estimate_kb": self.cache.get_memory_estimate_kb(),
            "active_models": list(self._managers.keys()),
            "loaded_models": [m.model_name for m in self._managers.values() if m.is_loaded],
        }

    def shutdown(self) -> None:
        """Alias for unloading all active model assets on orchestrator cleanup."""
        for manager in self._managers.values():
            manager.shutdown()
