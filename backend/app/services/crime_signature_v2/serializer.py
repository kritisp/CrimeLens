"""
CrimeLens AI — Crime Signature Engine v2 Serializer

Handles serialization of CrimeSignatureV2 objects to formatted JSON.
"""

from typing import Any, Dict
from app.services.crime_signature_v2.models import CrimeSignatureV2


class SignatureSerializer:
    """Serializes the CrimeSignatureV2 to structured dictionaries or JSON strings."""

    @staticmethod
    def to_dict(signature: CrimeSignatureV2) -> Dict[str, Any]:
        """Dumps the Pydantic model to a standard dictionary."""
        return signature.model_dump(mode='json')

    @staticmethod
    def to_json(signature: CrimeSignatureV2, indent: int = 4) -> str:
        """Dumps the Pydantic model to a JSON string."""
        return signature.model_dump_json(indent=indent)
