"""
CrimeLens AI — Knowledge Graph Serializer

Serializes the GraphSchema into a standard nodes and links representation.
"""

from typing import Any, Dict
from app.domain.knowledge_graph.models import GraphSchema


class GraphSerializer:
    """Serializes GraphSchema for inspection or downstream API usage."""

    @staticmethod
    def to_dict(schema: GraphSchema) -> Dict[str, Any]:
        """Returns a generic dictionary representation."""
        return {
            "nodes": [node.model_dump() for node in schema.nodes],
            "edges": [edge.model_dump() for edge in schema.edges]
        }

    @staticmethod
    def to_json(schema: GraphSchema, indent: int = 4) -> str:
        """Returns a formatted JSON string."""
        import json
        return json.dumps(GraphSerializer.to_dict(schema), indent=indent)
