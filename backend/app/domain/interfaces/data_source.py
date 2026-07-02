"""
CrimeLens AI — Data Ingestion Source Interfaces

Defines the storage-independent repository contract for fetching raw,
unvalidated FIR structures from various upstream sources.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict


class FIRDataSource(ABC):
    """
    Abstract storage-agnostic interface for fetching raw FIR data payloads.
    Provides the primary abstraction layer separating our pipeline services
    from database clients (e.g. JSON dumps, SQLite, Catalyst Data Store).
    """

    @abstractmethod
    async def fetch_raw_fir(self, case_master_id: int) -> Dict[str, Any]:
        """
        Retrieves a raw, unvalidated FIR dictionary structure matching
        the target CaseMasterID from the storage engine.

        Args:
            case_master_id: Primary key ID referencing CaseMaster.

        Returns:
            A dictionary containing raw key-value representations of CaseMaster,
            Complainant, Victims, Accused, and legal Section associations.

        Raises:
            NotFoundError: if no matching case is found in storage.
            ServiceUnavailableError: if connection to storage client fails.
        """
        pass

    @abstractmethod
    async def fetch_raw_fir_by_crime_no(self, crime_no: str) -> Dict[str, Any]:
        """
        Retrieves a raw, unvalidated FIR dictionary structure matching
        the target CrimeNo identifier from the storage engine.

        Args:
            crime_no: Unique 17-digit KSP identifier string.

        Returns:
            A dictionary representing the raw case layout.

        Raises:
            NotFoundError: if no matching crime is found.
            ServiceUnavailableError: if connection fails.
        """
        pass
