"""
CrimeLens AI — Graph Database Repository Interface

Defines the interface contract for persisting knowledge graph entities and edges.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class GraphRepository(ABC):
    """
    Abstract interface governing Graph Database storage engines (e.g. Neo4j).
    """

    @abstractmethod
    async def get_nodes(self) -> List[Dict[str, Any]]:
        """Retrieves all nodes in the knowledge graph."""
        pass

    @abstractmethod
    async def get_links(self) -> List[Dict[str, Any]]:
        """Retrieves all relationship links in the knowledge graph."""
        pass

    @abstractmethod
    async def add_case_node(self, case_id: int, properties: Dict[str, Any]) -> None:
        """Adds or updates a CrimeCase node in the graph."""
        pass

    @abstractmethod
    async def add_accused_node(self, accused_name: str, properties: Dict[str, Any]) -> None:
        """Adds or updates a Suspect/Accused node in the graph."""
        pass

    @abstractmethod
    async def add_relationship(
        self, source_id: str, target_id: str, rel_type: str, properties: Dict[str, Any]
    ) -> None:
        """Adds or updates a relationship edge between two nodes in the graph."""
        pass
