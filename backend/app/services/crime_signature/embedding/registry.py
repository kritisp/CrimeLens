"""
CrimeLens AI — Embedding Model Registry

Implements decorator-based registry mappings for managing dynamic embedding
provider classes.
"""

from __future__ import annotations

from typing import Dict, Type

from app.services.crime_signature.embedding.interfaces import EmbeddingProvider


class ModelRegistry:
    """
    Tracks and matches registered strategy provider classes.
    Enables modular addition of future models without editing core logic.
    """

    _registry: Dict[str, Type[EmbeddingProvider]] = {}

    @classmethod
    def register(cls, name: str):
        """
        Decorator registering the decorated class under the specified provider lookup name.

        Args:
            name: Case-insensitive unique identifier for this provider.
        """
        def decorator(
            provider_cls: Type[EmbeddingProvider],
        ) -> Type[EmbeddingProvider]:
            cls._registry[name.lower().strip()] = provider_cls
            return provider_cls
        return decorator

    @classmethod
    def get_provider_class(cls, name: str) -> Type[EmbeddingProvider]:
        """
        Gets a registered provider class from the mappings registry.

        Args:
            name: The registered lookup identifier.

        Returns:
            The matching EmbeddingProvider class.

        Raises:
            ValueError: If the provider is unregistered.
        """
        provider_cls = cls._registry.get(name.lower().strip())
        if not provider_cls:
            raise ValueError(
                f"Embedding provider '{name}' is not registered in ModelRegistry. "
                f"Available registry keys: {list(cls._registry.keys())}"
            )
        return provider_cls
