"""
CrimeLens AI — API Network Endpoints

Exposes Knowledge Graph nodes, links, expansions, and graph intelligence statistics.
"""

from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.setup import get_db
from app.infrastructure.database.repositories.sqlite_repository import SQLiteFIRRepository
from app.services.graph_intelligence.service import GraphIntelligenceService

router = APIRouter()
intel_service = GraphIntelligenceService()


async def _get_full_graph_data(db: AsyncSession) -> Dict[str, Any]:
    """Helper to fetch all cases from database and run Graph Intelligence analysis."""
    repo = SQLiteFIRRepository(db)
    cases = await repo.list_raw_firs()
    return intel_service.compute_graph_intelligence(cases)


@router.get("/nodes", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def get_nodes(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns all nodes in the crime intelligence network with computed centrality metrics."""
    data = await _get_full_graph_data(db)
    return data["nodes"]


@router.get("/links", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def get_links(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns all relationships in the crime intelligence network."""
    data = await _get_full_graph_data(db)
    return data["links"]


@router.get("/expand", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def expand_node(node_id: str, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Expands a single node. Returns the target node and its direct 1st-degree
    neighbors along with connection links.
    """
    data = await _get_full_graph_data(db)
    nodes = data["nodes"]
    links = data["links"]

    # Filter links connected to target node_id
    filtered_links = [lk for lk in links if lk["source"] == node_id or lk["target"] == node_id]
    
    # Identify connected node IDs
    connected_ids = {node_id}
    for lk in filtered_links:
        connected_ids.add(lk["source"])
        connected_ids.add(lk["target"])

    # Filter connected nodes
    filtered_nodes = [nd for nd in nodes if nd["id"] in connected_ids]

    return {
        "nodes": filtered_nodes,
        "links": filtered_links
    }


@router.get("/statistics", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_statistics(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Returns global network statistics, including density, node counts, and community clusters."""
    data = await _get_full_graph_data(db)
    return data["statistics"]


@router.get("/entity/{node_id}", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_entity_details(node_id: str, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Returns detailed properties and relations of a specific node."""
    data = await _get_full_graph_data(db)
    nodes = data["nodes"]
    
    target_node = next((nd for nd in nodes if nd["id"] == node_id), None)
    if not target_node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Node {node_id} was not found in the graph."
        )
        
    return target_node


@router.get("/search", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def search_network(q: str, db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """Searches nodes matching the string keyword in node properties (name, summary, ID)."""
    data = await _get_full_graph_data(db)
    nodes = data["nodes"]
    query = q.lower()
    
    matches = []
    for nd in nodes:
        name = str(nd.get("label", "")).lower()
        node_id = str(nd.get("id", "")).lower()
        summary = str(nd.get("properties", {}).get("summary", "")).lower()
        
        if query in name or query in node_id or query in summary:
            matches.append(nd)
            
    return matches
