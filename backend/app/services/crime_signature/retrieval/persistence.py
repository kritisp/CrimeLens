"""
CrimeLens AI — Vector Index Persistence Layer

Saves and loads VectorIndex binary payloads and metadata maps using secure
JSON mappings rather than unsafe python pickle.
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Tuple

import numpy as np

from app.services.crime_signature.retrieval.exceptions import (
    IndexLoadError,
    RetrievalError,
)
from app.services.crime_signature.retrieval.faiss_index import FAISSIndex
from app.services.crime_signature.retrieval.interfaces import VectorIndex
from app.services.crime_signature.retrieval.models import CrimeMetadata


class IndexPersistence:
    """
    Serializes and deserializes index structures and metadata records mapping.
    """

    @staticmethod
    def save(index: VectorIndex, directory_path: str) -> None:
        """
        Saves index binary data and metadata descriptors to the specified folder.

        Args:
            index: The VectorIndex to serialize.
            directory_path: Target storage folder path.
        """
        try:
            os.makedirs(directory_path, exist_ok=True)
            faiss_bytes, meta = index.serialize()

            # 1. Structure JSON metadata mapping
            id_meta_dict = {}
            for index_id, metadata in meta["id_to_metadata"].items():
                id_meta_dict[str(index_id)] = {
                    "case_id": metadata.case_id,
                    "crime_signature_hash": metadata.crime_signature_hash,
                    "embedding_version": metadata.embedding_version,
                    "pipeline_version": metadata.pipeline_version,
                    "feature_version": metadata.feature_version,
                    "creation_timestamp": metadata.creation_timestamp.isoformat(),
                }

            serializable_meta = {
                "dimension": meta["dimension"],
                "metric": meta["metric"],
                "index_type": meta["index_type"],
                "next_id": meta["next_id"],
                "is_faiss": meta["is_faiss"],
                "id_to_metadata": id_meta_dict,
            }

            # If C++ FAISS was not used, serialize numpy arrays as list floats
            if not meta["is_faiss"]:
                arr = meta["numpy_vectors"]
                serializable_meta["numpy_vectors"] = arr.tolist() if arr is not None else []

            # 2. Write binary index file
            bin_path = Path(directory_path) / "index.bin"
            with open(bin_path, "wb") as f:
                f.write(faiss_bytes)

            # 3. Write metadata JSON descriptors
            meta_path = Path(directory_path) / "metadata.json"
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump(serializable_meta, f, indent=2)

        except Exception as exc:
            raise RetrievalError(f"Failed to serialize VectorIndex: {str(exc)}") from exc

    @staticmethod
    def load(directory_path: str) -> VectorIndex:
        """
        Loads and reconstructs a VectorIndex from files.

        Args:
            directory_path: The folder containing index files.

        Returns:
            The loaded VectorIndex.

        Raises:
            IndexLoadError: If required files are missing or corrupted.
        """
        bin_path = Path(directory_path) / "index.bin"
        meta_path = Path(directory_path) / "metadata.json"

        if not bin_path.exists() or not meta_path.exists():
            raise IndexLoadError(
                f"Missing required index files inside target directory: {directory_path}. "
                f"Ensure index.bin and metadata.json are present."
            )

        try:
            # 1. Read binary files
            with open(bin_path, "rb") as f:
                index_data = f.read()

            # 2. Read metadata JSON mappings
            with open(meta_path, "r", encoding="utf-8") as f:
                raw_meta = json.load(f)

            # 3. Reconstruct CrimeMetadata objects
            reconstructed_meta = {}
            for str_id, props in raw_meta["id_to_metadata"].items():
                dt = datetime.fromisoformat(props["creation_timestamp"])
                reconstructed_meta[int(str_id)] = CrimeMetadata(
                    case_id=props["case_id"],
                    crime_signature_hash=props["crime_signature_hash"],
                    embedding_version=props["embedding_version"],
                    pipeline_version=props["pipeline_version"],
                    feature_version=props["feature_version"],
                    creation_timestamp=dt,
                )

            deserialized_meta = {
                "dimension": raw_meta["dimension"],
                "metric": raw_meta["metric"],
                "index_type": raw_meta["index_type"],
                "next_id": raw_meta["next_id"],
                "is_faiss": raw_meta["is_faiss"],
                "id_to_metadata": reconstructed_meta,
            }

            # Reconstruct numpy arrays if fallback was stored
            if not raw_meta["is_faiss"]:
                deserialized_meta["numpy_vectors"] = np.array(
                    raw_meta["numpy_vectors"], dtype=np.float32
                ).reshape(-1, raw_meta["dimension"])
            else:
                deserialized_meta["numpy_vectors"] = None

            # 4. Instantiate and deserialize
            index = FAISSIndex()
            index.deserialize(index_data, deserialized_meta)
            return index

        except Exception as exc:
            raise IndexLoadError(f"VectorIndex load execution failed: {str(exc)}") from exc
