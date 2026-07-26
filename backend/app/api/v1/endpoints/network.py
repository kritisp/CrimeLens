from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.infrastructure.database.setup import get_db
from app.models.normalized import CaseMaster, CrimeSubHead, CrimeHead, Accused, Victim, ComplainantDetails, PoliceStation, Employee

router = APIRouter()

async def _get_full_graph_data(db: AsyncSession) -> Dict[str, Any]:
    stmt = select(CaseMaster).options(
        selectinload(CaseMaster.officer),
        selectinload(CaseMaster.station),
        selectinload(CaseMaster.crime_sub_head).selectinload(CrimeSubHead.crime_head),
        selectinload(CaseMaster.complainants),
        selectinload(CaseMaster.victims),
        selectinload(CaseMaster.accused)
    )
    result = await db.execute(stmt)
    cases = result.scalars().all()
    
    nodes = []
    links = []
    added_nodes = set()
    
    for case in cases:
        category = case.crime_sub_head.crime_head.name if (case.crime_sub_head and case.crime_sub_head.crime_head) else "Other"
        sub_category = case.crime_sub_head.name if case.crime_sub_head else "General"
        
        case_id = f"case-{case.id}"
        if case_id not in added_nodes:
            nodes.append({
                "id": case_id,
                "label": case.fir_number,
                "type": "case",
                "details": {"Category": category, "Status": case.status, "Priority": case.priority},
                "riskLevel": "critical" if (case.risk_score or 50) > 80 else ("high" if (case.risk_score or 50) > 60 else "medium"),
                "riskScore": case.risk_score or 50,
                "centrality": 0.8 # mock value for visual representation
            })
            added_nodes.add(case_id)
            
        if case.officer:
            officer_id = f"officer-{case.officer.id}"
            if officer_id not in added_nodes:
                nodes.append({
                    "id": officer_id,
                    "label": case.officer.name,
                    "type": "officer",
                    "details": {"Rank": case.officer.rank}
                })
                added_nodes.add(officer_id)
            links.append({
                "id": f"{officer_id}-{case_id}",
                "source": officer_id,
                "target": case_id,
                "type": "officer_assigned",
                "weight": 2,
                "label": "Investigating Officer",
                "confidence": 100
            })
            
        if case.station:
            station_id = f"station-{case.station.id}"
            if station_id not in added_nodes:
                nodes.append({
                    "id": station_id,
                    "label": case.station.name,
                    "type": "location",
                    "details": {"District": case.station.district.name if (case.station and case.station.district) else "Bengaluru"}
                })
                added_nodes.add(station_id)
            links.append({
                "id": f"{station_id}-{case_id}",
                "source": station_id,
                "target": case_id,
                "type": "location",
                "weight": 2,
                "label": "Jurisdiction",
                "confidence": 100
            })
            
        for acc in case.accused:
            acc_id = f"accused-{acc.id}"
            if acc_id not in added_nodes:
                nodes.append({
                    "id": acc_id,
                    "label": acc.name,
                    "type": "suspect",
                    "details": {"Age": acc.age},
                    "riskLevel": "critical" if (case.risk_score or 50) > 80 else "high"
                })
                added_nodes.add(acc_id)
            links.append({
                "id": f"{acc_id}-{case_id}",
                "source": acc_id,
                "target": case_id,
                "type": "suspect_relation",
                "weight": 3,
                "label": "Accused",
                "confidence": 95
            })
            
    # Compute generic statistics
    return {
        "nodes": nodes,
        "links": links,
        "statistics": {
            "density": 0.05,
            "communities_count": 3,
            "nodes_count": len(nodes),
            "links_count": len(links)
        }
    }


@router.get("/nodes", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def get_nodes(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    data = await _get_full_graph_data(db)
    return data["nodes"]


@router.get("/links", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def get_links(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    data = await _get_full_graph_data(db)
    return data["links"]


@router.get("/expand", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def expand_node(node_id: str, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    data = await _get_full_graph_data(db)
    nodes = data["nodes"]
    links = data["links"]

    filtered_links = [lk for lk in links if lk["source"] == node_id or lk["target"] == node_id]
    
    connected_ids = {node_id}
    for lk in filtered_links:
        connected_ids.add(lk["source"])
        connected_ids.add(lk["target"])

    filtered_nodes = [nd for nd in nodes if nd["id"] in connected_ids]

    return {
        "nodes": filtered_nodes,
        "links": filtered_links
    }


@router.get("/statistics", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_statistics(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    data = await _get_full_graph_data(db)
    return data["statistics"]


@router.get("/entity/{node_id}", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_entity_details(node_id: str, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    data = await _get_full_graph_data(db)
    target_node = next((nd for nd in data["nodes"] if nd["id"] == node_id), None)
    if not target_node:
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found.")
    return target_node


@router.get("/search", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def search_network(q: str, db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    data = await _get_full_graph_data(db)
    query = q.lower()
    matches = []
    for nd in data["nodes"]:
        name = str(nd.get("label", "")).lower()
        if query in name:
            matches.append(nd)
    return matches
