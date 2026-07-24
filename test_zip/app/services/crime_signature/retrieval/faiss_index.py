"""
CrimeLens AI — FAISS Vector Index Strategy

Concrete implementation of VectorIndex. Uses the C++ FAISS library if installed,
and falls back to a high-fidelity NumPy-based vector similarity search engine
if the dependency is absent.
"""

from __future__ import annotations

import io
import math
import pickle
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from app.services.crime_signature.retrieval.exceptions import (
    IndexBuildError,
    IndexLoadError,
)
from app.services.crime_signature.retrieval.interfaces import VectorIndex
from app.services.crime_signature.retrieval.models import CrimeMetadata, SearchResult

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False


class FAISSIndex(VectorIndex):
    """
    FAISS Strategy Index.
    Supports Flat, IVF, and HNSW indexes with seamless NumPy math fallback.
    """

    def __init__(self) -> None:
        self.dimension: int = 0
        self.metric: str = "cosine"
        self.index_type: str = "flat"
        
        # Mapping index offsets to metadata records
        self._id_to_metadata: Dict[int, CrimeMetadata] = {}
        self._next_id: int = 0

        # C++ FAISS Index properties
        self._faiss_index: Optional[Any] = None

        # NumPy fallback properties
        self._numpy_vectors: Optional[np.ndarray] = None  # shape: (N, D)

    def build(self, dimension: int, metric: str, index_type: str = "flat") -> None:
        self.dimension = dimension
        self.metric = metric.lower().strip()
        self.index_type = index_type.lower().strip()

        self._id_to_metadata.clear()
        self._next_id = 0

        if FAISS_AVAILABLE:
            self._build_faiss()
        else:
            self._numpy_vectors = np.empty((0, self.dimension), dtype=np.float32)

    def _build_faiss(self) -> None:
        """Constructs target C++ FAISS index structure."""
        try:
            # Note: For Cosine Similarity, we use IndexFlatIP (Inner Product)
            # and normalize vectors to unit length prior to addition/search
            if self.metric == "l2":
                faiss_metric = faiss.METRIC_L2
            else:
                faiss_metric = faiss.METRIC_INNER_PRODUCT

            if self.index_type == "hnsw":
                # Construct HNSW Flat Index (M = 32 links per node)
                self._faiss_index = faiss.IndexHNSWFlat(self.dimension, 32, faiss_metric)
            elif self.index_type == "ivf":
                # Construct IVF Index (Flat quantizer with 10 centroids)
                quantizer = faiss.IndexFlatL2(self.dimension) if self.metric == "l2" else faiss.IndexFlatIP(self.dimension)
                # Centroids selection: 10 clusters
                self._faiss_index = faiss.IndexIVFFlat(quantizer, self.dimension, 10, faiss_metric)
                # IVF requires dummy training; train on random vectors if not trained
                dummy_training = np.random.randn(50, self.dimension).astype("float32")
                if self.metric == "cosine":
                    # Normalize
                    norms = np.linalg.norm(dummy_training, axis=1, keepdims=True)
                    dummy_training = np.divide(dummy_training, norms, out=dummy_training, where=norms > 0)
                self._faiss_index.train(dummy_training)
                # nprobe determines centroid searches probe width
                self._faiss_index.nprobe = 3
            else:
                # Default Flat L2 / IP
                if self.metric == "l2":
                    self._faiss_index = faiss.IndexFlatL2(self.dimension)
                else:
                    self._faiss_index = faiss.IndexFlatIP(self.dimension)
        except Exception as exc:
            raise IndexBuildError(f"FAISS index construction failed: {str(exc)}") from exc

    def _normalize_vector(self, vec: np.ndarray) -> np.ndarray:
        """L2 normalizes a vector or matrix."""
        if len(vec.shape) == 1:
            norm = np.linalg.norm(vec)
            return vec / norm if norm > 0 else vec
        else:
            norms = np.linalg.norm(vec, axis=1, keepdims=True)
            return np.divide(vec, norms, out=vec.copy(), where=norms > 0)

    def add(self, vectors: List[List[float]], metadata_list: List[CrimeMetadata]) -> None:
        if len(vectors) != len(metadata_list):
            raise IndexBuildError("Vectors length and metadata records must match.")

        if not vectors:
            return

        # Convert to numpy array float32
        arr = np.array(vectors, dtype=np.float32)

        # Update metadata mapping indexes
        for meta in metadata_list:
            self._id_to_metadata[self._next_id] = meta
            self._next_id += 1

        if FAISS_AVAILABLE and self._faiss_index is not None:
            if self.metric == "cosine":
                arr = self._normalize_vector(arr)
            self._faiss_index.add(arr)
        else:
            # NumPy fallback append
            if self._numpy_vectors is None:
                self._numpy_vectors = np.empty((0, self.dimension), dtype=np.float32)
            self._numpy_vectors = np.vstack([self._numpy_vectors, arr])

    def search_top_k(self, query: List[float], k: int) -> List[SearchResult]:
        if k <= 0 or self.size() == 0:
            return []

        q_arr = np.array(query, dtype=np.float32)

        if FAISS_AVAILABLE and self._faiss_index is not None:
            # Real FAISS search execution
            if self.metric == "cosine":
                q_arr = self._normalize_vector(q_arr)
            
            # Reshape query to 2D matrix shape (1, D)
            q_reshaped = q_arr.reshape(1, -1)
            distances, indices = self._faiss_index.search(q_reshaped, k)
            
            results = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx == -1:
                    continue
                results.append(
                    SearchResult(
                        case_id=self._id_to_metadata[idx].case_id,
                        score=float(dist),
                        metadata=self._id_to_metadata[idx],
                    )
                )
            return results
        else:
            # NumPy fallback calculation
            return self._numpy_search(q_arr, k=k)

    def search_radius(self, query: List[float], radius: float) -> List[SearchResult]:
        if self.size() == 0:
            return []

        q_arr = np.array(query, dtype=np.float32)

        if FAISS_AVAILABLE and self._faiss_index is not None:
            # FAISS range search
            if self.metric == "cosine":
                q_arr = self._normalize_vector(q_arr)
            
            q_reshaped = q_arr.reshape(1, -1)
            # Range search threshold translation
            # For Inner Product, range searches look for values > radius.
            # For L2, range searches look for values < radius.
            limits, distances, indices = self._faiss_index.range_search(q_reshaped, radius)
            
            results = []
            for dist, idx in zip(distances, indices):
                if idx == -1:
                    continue
                results.append(
                    SearchResult(
                        case_id=self._id_to_metadata[idx].case_id,
                        score=float(dist),
                        metadata=self._id_to_metadata[idx],
                    )
                )
            # Sort by metric rules
            reverse_sort = (self.metric != "l2")
            results.sort(key=lambda x: x.score, reverse=reverse_sort)
            return results
        else:
            # NumPy fallback radius search
            return self._numpy_search(q_arr, k=self.size(), radius=radius)

    def search_batch(self, queries: List[List[float]], k: int) -> List[List[SearchResult]]:
        if not queries or k <= 0 or self.size() == 0:
            return []

        q_arr = np.array(queries, dtype=np.float32)

        if FAISS_AVAILABLE and self._faiss_index is not None:
            if self.metric == "cosine":
                q_arr = self._normalize_vector(q_arr)
                
            distances, indices = self._faiss_index.search(q_arr, k)
            
            batch_results = []
            for i in range(len(queries)):
                results = []
                for dist, idx in zip(distances[i], indices[i]):
                    if idx == -1:
                        continue
                    results.append(
                        SearchResult(
                            case_id=self._id_to_metadata[idx].case_id,
                            score=float(dist),
                            metadata=self._id_to_metadata[idx],
                        )
                    )
                batch_results.append(results)
            return batch_results
        else:
            # NumPy fallback batch search loop
            return [self._numpy_search(q, k=k) for q in q_arr]

    def _numpy_search(self, q: np.ndarray, k: int, radius: Optional[float] = None) -> List[SearchResult]:
        """NumPy vector similarity search execution core."""
        if self._numpy_vectors is None or len(self._numpy_vectors) == 0:
            return []

        vectors = self._numpy_vectors
        
        if self.metric == "cosine":
            q_norm = self._normalize_vector(q)
            v_norm = self._normalize_vector(vectors)
            scores = np.dot(v_norm, q_norm)  # Inner product of L2 norms (Cosine similarity)
            # Cosine: larger score is better (descending sort)
            sort_indices = np.argsort(scores)[::-1]
        elif self.metric == "ip":
            scores = np.dot(vectors, q)
            # IP: larger score is better (descending sort)
            sort_indices = np.argsort(scores)[::-1]
        else:  # L2 distance
            diff = vectors - q
            scores = np.sum(diff * diff, axis=1)  # Squared L2 distance
            # L2: smaller distance is better (ascending sort)
            sort_indices = np.argsort(scores)

        results = []
        for idx in sort_indices:
            score = float(scores[idx])
            
            # Apply radius filters if present
            if radius is not None:
                if self.metric == "l2":
                    if score > radius:
                        continue
                else:  # Cosine / IP
                    if score < radius:
                        continue

            results.append(
                SearchResult(
                    case_id=self._id_to_metadata[idx].case_id,
                    score=score,
                    metadata=self._id_to_metadata[idx],
                )
            )

        return results[:k]

    def size(self) -> int:
        return len(self._id_to_metadata)

    def serialize(self) -> Tuple[bytes, Dict[int, Any]]:
        # Serialize metadata using pickle
        meta_data = {
            "dimension": self.dimension,
            "metric": self.metric,
            "index_type": self.index_type,
            "next_id": self._next_id,
            "id_to_metadata": self._id_to_metadata,
        }

        if FAISS_AVAILABLE and self._faiss_index is not None:
            # Read FAISS binary via vector writer
            try:
                # faiss.serialize_index converts the index object into a numpy uint8 array
                faiss_bytes = faiss.serialize_index(self._faiss_index).tobytes()
                meta_data["is_faiss"] = True
            except Exception as exc:
                raise IndexBuildError(f"Failed to serialize FAISS binary: {str(exc)}") from exc
        else:
            # Serialize NumPy fallback vectors
            meta_data["is_faiss"] = False
            meta_data["numpy_vectors"] = self._numpy_vectors
            faiss_bytes = b""

        return faiss_bytes, meta_data

    def deserialize(self, index_data: bytes, metadata_map: Dict[int, Any]) -> None:
        try:
            self.dimension = metadata_map["dimension"]
            self.metric = metadata_map["metric"]
            self.index_type = metadata_map["index_type"]
            self._next_id = metadata_map["next_id"]
            self._id_to_metadata = metadata_map["id_to_metadata"]

            is_faiss = metadata_map.get("is_faiss", False)

            if FAISS_AVAILABLE and is_faiss and index_data:
                # Reconstruct C++ FAISS index
                # Convert bytes back to numpy array before loading
                np_arr = np.frombuffer(index_data, dtype=np.uint8)
                self._faiss_index = faiss.deserialize_index(np_arr)
            else:
                # Reconstruct NumPy arrays fallback
                self._numpy_vectors = metadata_map["numpy_vectors"]
                self._faiss_index = None
        except Exception as exc:
            raise IndexLoadError(f"VectorIndex deserialization failed: {str(exc)}") from exc
