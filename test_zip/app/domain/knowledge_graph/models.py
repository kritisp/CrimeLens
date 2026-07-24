"""
CrimeLens AI — Knowledge Graph Domain Models

Defines the plain Python representation of the canonical graph structure 
(Nodes, Edges, GraphSchema) that will power intelligence modules.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class GraphNode(BaseModel):
    """Base class for all knowledge graph entities."""
    node_id: str = Field(..., description="Unique deterministic identifier for the node.")
    label: str = Field(..., description="Node classification label (e.g., 'Crime', 'Victim').")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Key-value properties of the entity.")


class GraphEdge(BaseModel):
    """Base class for all knowledge graph relationships."""
    source_id: str = Field(..., description="ID of the origin node.")
    target_id: str = Field(..., description="ID of the destination node.")
    relationship_type: str = Field(..., description="Directed relationship type (e.g., 'CRIME_OCCURRED_AT').")
    weight: float = Field(1.0, description="Strength or frequency of the connection.")
    confidence: float = Field(1.0, description="Algorithmic certainty of this edge.")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Edge metadata (e.g., timestamps).")


class GraphSchema(BaseModel):
    """Container holding a disconnected graph subset."""
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)


# ---------------------------------------------------------
# Node Sub-types (for strong typing if needed down the line)
# ---------------------------------------------------------

class CrimeNode(GraphNode):
    label: str = "Crime"

class VictimNode(GraphNode):
    label: str = "VictimProfile"

class AccusedNode(GraphNode):
    label: str = "AccusedProfile"

class PoliceStationNode(GraphNode):
    label: str = "PoliceStation"

class LegalSectionNode(GraphNode):
    label: str = "LegalSection"

class TaxonomyNode(GraphNode):
    label: str = "CrimeTaxonomy"

class BehaviorNode(GraphNode):
    label: str = "BehaviorCluster"

class GangNode(GraphNode):
    label: str = "OrganizedGang"
