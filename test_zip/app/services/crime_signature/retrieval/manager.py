"""
CrimeLens AI — Vector Index Manager

Maintains memory state of active VectorIndex, coordinates disk storage serialization,
and updates configurations dynamically from configurations yaml.
"""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import structlog
import yaml

from app.services.crime_signature.retrieval.builder import IndexBuilder
from app.services.crime_signature.retrieval.exceptions import IndexLoadError
from app.services.crime_signature.retrieval.interfaces import VectorIndex
from app.services.crime_signature.retrieval.models import CrimeMetadata
from app.services.crime_signature.retrieval.persistence import IndexPersistence

logger = structlog.get_logger("retrieval_index_manager")


class IndexManager:
    """
    Manages active indexes memory transitions, handles hot reloads, and
    executes serialization calls.
    """

    def __init__(self, config_path: Optional[str] = None) -> None:
        self.config_path = config_path or self._resolve_config_path()
        self.config = self._load_yaml_config()

        # Resolve retrieval config parameters
        ret_cfg = self.config.get("retrieval", {})
        self.index_type: str = ret_cfg.get("index_type", "flat")
        self.metric: str = ret_cfg.get("metric", "cosine")
        self.dimension: int = ret_cfg.get("dimension", 384)
        self.persistence_dir: str = ret_cfg.get("persistence_dir", "backend/storage/index")

        # Active index state holder
        self._index: Optional[VectorIndex] = None

    def _resolve_config_path(self) -> str:
        """Looks up retrieval configuration YAML in standard monorepo folder locations."""
        possible_paths = [
            Path("configs/retrieval.yaml"),
            Path("backend/configs/retrieval.yaml"),
            Path(__file__).resolve().parents[4] / "backend/configs/retrieval.yaml",
            Path(__file__).resolve().parents[4] / "configs/retrieval.yaml",
        ]

        for path in possible_paths:
            if path.exists() and path.is_file():
                return str(path.resolve())

        return "backend/configs/retrieval.yaml"

    def _load_yaml_config(self) -> Dict[str, Any]:
        """Reads configuration params from YAML file."""
        if not os.path.exists(self.config_path):
            logger.warning(
                "Retrieval configuration file not found, loading defaults.",
                config_path=self.config_path,
            )
            return {
                "retrieval": {
                    "index_type": "flat",
                    "metric": "cosine",
                    "top_k": 10,
                    "radius": 0.8,
                    "batch_size": 64,
                    "dimension": 384,
                    "persistence_dir": "backend/storage/index",
                }
            }

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        except Exception as exc:
            logger.error(
                "Failed to parse retrieval yaml configuration.",
                config_path=self.config_path,
                error=str(exc),
            )
            raise

    def get_index(self) -> VectorIndex:
        """Gets active index, lazily loading or creating a new one if not loaded."""
        if self._index is None:
            self.load_index()
        return self._index  # type: ignore[return-value]

    def add_documents(self, vectors: List[List[float]], metadata_list: List[CrimeMetadata]) -> None:
        """Adds new coordinate vectors and metadata to active index."""
        index = self.get_index()
        index.add(vectors, metadata_list)
        logger.info(
            "Added vectors to index.",
            count=len(vectors),
            total_size=index.size(),
        )

    def save_index(self) -> None:
        """Serializes active index to storage directory path."""
        if self._index is None:
            logger.warning("Attempted to serialize empty index. Skipping.")
            return

        start = time.perf_counter()
        IndexPersistence.save(self._index, self.persistence_dir)
        duration_ms = (time.perf_counter() - start) * 1000.0
        logger.info(
            "Vector index saved successfully.",
            directory=self.persistence_dir,
            save_duration_ms=round(duration_ms, 2),
            index_size=self._index.size(),
        )

    def load_index(self) -> None:
        """Restores index from persistent storage directory or instantiates new."""
        start = time.perf_counter()
        bin_path = Path(self.persistence_dir) / "index.bin"
        meta_path = Path(self.persistence_dir) / "metadata.json"

        if bin_path.exists() and meta_path.exists():
            try:
                self._index = IndexPersistence.load(self.persistence_dir)
                duration_ms = (time.perf_counter() - start) * 1000.0
                logger.info(
                    "Restored index from persistence storage.",
                    directory=self.persistence_dir,
                    load_duration_ms=round(duration_ms, 2),
                    index_size=self._index.size(),
                )
                return
            except Exception as exc:
                logger.error(
                    "Persistence loading failed. Building fresh fallback index.",
                    error=str(exc),
                )

        # Fallback to building a fresh index
        logger.info("Initializing new empty index.")
        self._index = IndexBuilder.build_index(
            dimension=self.dimension,
            metric=self.metric,
            index_type=self.index_type,
        )

    def rebuild_index(self, dimension: Optional[int] = None) -> None:
        """Wipes active state and initializes a new empty index."""
        target_dim = dimension or self.dimension
        self._index = IndexBuilder.build_index(
            dimension=target_dim,
            metric=self.metric,
            index_type=self.index_type,
        )
        logger.info(
            "Vector index wiped and rebuilt.",
            dimension=target_dim,
            metric=self.metric,
            index_type=self.index_type,
        )

    def size(self) -> int:
        """Returns the number of documents in index."""
        if self._index is None:
            return 0
        return self._index.size()
