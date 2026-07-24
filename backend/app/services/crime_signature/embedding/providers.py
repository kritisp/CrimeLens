"""
CrimeLens AI — Sentence Transformer Provider

Concrete Strategy pattern implementation loading local weights or executing
deterministic fallback vector models.
"""

from __future__ import annotations

import hashlib
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.services.crime_signature.embedding.exceptions import ModelLoadError
from app.services.crime_signature.embedding.interfaces import EmbeddingProvider
from app.services.crime_signature.embedding.models import (
    EmbeddingMetadata,
    EmbeddingVersion,
)
from app.services.crime_signature.embedding.registry import ModelRegistry


@ModelRegistry.register("sentence_transformers")
class SentenceTransformerProvider(EmbeddingProvider):
    """
    Sentence Transformers Strategy Provider.
    Enables raw vector calculations using local models or mock algorithms.
    """

    def __init__(self) -> None:
        self.model_name: Optional[str] = None
        self.model_path: Optional[str] = None
        self.dimension: Optional[int] = None
        self.mock_mode: bool = True
        
        # Versioning metadata parameters
        self.model_version: str = "0.0.0"
        self.feature_version: str = "0.0.0"
        self.pipeline_version: str = "0.0.0"
        
        # Lazy loaded model instance
        self._model: Any = None
        self.load_time_ms: float = 0.0

    def initialize(self, config: Dict[str, Any]) -> None:
        \"\"\"
        Loads the configured model details. Uses Hugging Face REST API.
        \"\"\"
        import os
        self.model_name = config.get("model_name", "sentence-transformers/all-MiniLM-L6-v2")
        self.model_path = config.get("model_path", "")
        self.dimension = config.get("dimension", 384)
        self.mock_mode = config.get("mock_mode", False)
        
        self.model_version = config.get("model_version", "1.0.0")
        self.feature_version = config.get("feature_version", "1.0.0")
        self.pipeline_version = config.get("pipeline_version", "1.0.0")

        self._api_key = os.getenv("HUGGINGFACE_API_KEY", "")

    def _generate_deterministic_mock_vector(self, text: str) -> List[float]:
        \"\"\"
        Generates a deterministic float vector mapped to configured dimensions.
        \"\"\"
        dim = self.dimension or 384
        # Seed deterministic byte sequence via SHA-256
        seed = hashlib.sha256(text.encode("utf-8")).digest()
        
        vector = []
        for i in range(dim):
            # Compute dimension-specific coordinate hashes
            coord_hash = hashlib.sha256(seed + i.to_bytes(4, "big")).digest()
            # Map coordinate projection to [-1.0, 1.0] interval
            coord_val = (int.from_bytes(coord_hash[:4], "big") / (2**32 - 1)) * 2.0 - 1.0
            vector.append(coord_val)
            
        return vector

    def embed_raw(self, text: str) -> List[float]:
        \"\"\"
        Translates raw input text into high-dimensional float coordinates via HF API.
        \"\"\"
        if not self.model_name or not self.dimension:
            raise ModelLoadError("SentenceTransformerProvider was not properly initialized.")

        if self.mock_mode or not self._api_key:
            # Run deterministic mock calculation
            vector = self._generate_deterministic_mock_vector(text)
            # Simulate minimal cpu hashing latency (~1ms)
            time.sleep(0.001)
            return vector
            
        # Call Hugging Face Inference API
        import urllib.request
        import json

        model = self.model_name
        if not model.startswith("sentence-transformers/"):
            model = f"sentence-transformers/{model}"

        url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model}"
        payload = {"inputs": text}

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                # Hugging Face feature-extraction returns a list of floats for a single string
                return [float(x) for x in res_data]
        except Exception as exc:
            raise ModelLoadError(
                f"HuggingFace inference failed for model {self.model_name}: {str(exc)}"
            ) from exc

    def get_metadata(self) -> EmbeddingMetadata:
        if not self.model_name or not self.dimension:
            raise ModelLoadError("SentenceTransformerProvider was not properly initialized.")

        version = EmbeddingVersion(
            model_version=self.model_version,
            feature_version=self.feature_version,
            pipeline_version=self.pipeline_version,
        )

        return EmbeddingMetadata(
            model_name=self.model_name,
            dimension=self.dimension,
            version=version,
        )


@ModelRegistry.register("gemini")
class GeminiEmbeddingProvider(EmbeddingProvider):
    """
    Google Gemini Embedding Strategy Provider.
    Calculates semantic text vectors using text-embedding-004 model via REST API.
    """

    def __init__(self) -> None:
        self.model_name: Optional[str] = None
        self.dimension: Optional[int] = None
        self.mock_mode: bool = False
        self._api_key: Optional[str] = None
        self.model_version: str = "1.0.0"
        self.feature_version: str = "1.0.0"
        self.pipeline_version: str = "1.0.0"

    def initialize(self, config: Dict[str, Any]) -> None:
        from app.core.config import settings
        # Model name defaults to text-embedding-004
        self.model_name = config.get("model_name", "text-embedding-004")
        self.dimension = config.get("dimension", 384)
        self.mock_mode = config.get("mock_mode", False)
        self.model_version = config.get("model_version", "1.0.0")
        self.feature_version = config.get("feature_version", "1.0.0")
        self.pipeline_version = config.get("pipeline_version", "1.0.0")

        if not self.mock_mode:
            api_key = settings.gemini_api_key
            if api_key and not api_key.startswith(("INSECURE", "your_", "YOUR_", "change_")):
                self._api_key = api_key.strip()

    def embed_raw(self, text: str) -> List[float]:
        if self.mock_mode or not self._api_key:
            # Fallback to deterministic mock calculation
            dim = self.dimension or 384
            import hashlib
            seed = hashlib.sha256(text.encode("utf-8")).digest()
            vector = []
            for i in range(dim):
                coord_hash = hashlib.sha256(seed + i.to_bytes(4, "big")).digest()
                coord_val = (int.from_bytes(coord_hash[:4], "big") / (2**32 - 1)) * 2.0 - 1.0
                vector.append(coord_val)
            return vector

        # Call Google Generative Language REST API using standard urllib
        import urllib.request
        import json

        model = self.model_name or "text-embedding-004"
        if not model.startswith("models/"):
            model = f"models/{model}"

        url = f"https://generativelanguage.googleapis.com/v1beta/{model}:embedContent?key={self._api_key}"
        payload = {
            "content": {
                "parts": [{"text": text}]
            },
            "outputDimensionality": self.dimension
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                return res_data["embedding"]["values"]
        except Exception as exc:
            raise ModelLoadError(
                f"Gemini embedding REST API call failed for model {self.model_name}: {str(exc)}"
            ) from exc

    def get_metadata(self) -> EmbeddingMetadata:
        version = EmbeddingVersion(
            model_version=self.model_version,
            feature_version=self.feature_version,
            pipeline_version=self.pipeline_version,
        )
        return EmbeddingMetadata(
            model_name=self.model_name or "gemini-embedding",
            dimension=self.dimension or 384,
            version=version,
        )


