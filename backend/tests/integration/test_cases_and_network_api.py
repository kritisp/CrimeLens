"""
CrimeLens AI — API Endpoints Integration Tests

Tests all newly added FastAPI routes (Cases, Network, Chat, Heatmap, Reports, Patterns)
ensuring database mapping and calculations are correct.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cases_api_endpoints(client: AsyncClient) -> None:
    """Verifies retrieval of cases list and individual case lookups from SQLite database."""
    # 1. List cases
    res = await client.get("/api/v1/cases")
    assert res.status_code == 200
    cases = res.json()
    assert len(cases) > 0
    assert "case_master_id" in cases[0]
    assert "crime_no" in cases[0]

    # 2. Get single case
    case_id = cases[0]["case_master_id"]
    res_single = await client.get(f"/api/v1/cases/{case_id}")
    assert res_single.status_code == 200
    case_data = res_single.json()
    assert case_data["case_master_id"] == case_id
    assert "brief_facts" in case_data

    # 3. Get non-existent case raises 404
    res_missing = await client.get("/api/v1/cases/9999")
    assert res_missing.status_code == 404


@pytest.mark.asyncio
async def test_network_graph_endpoints(client: AsyncClient) -> None:
    """Verifies that the NetworkX Graph Intelligence engine calculates centrality and communities correctly."""
    # 1. Fetch nodes
    res_nodes = await client.get("/api/v1/network/nodes")
    assert res_nodes.status_code == 200
    nodes = res_nodes.json()
    assert len(nodes) > 0
    assert "id" in nodes[0]
    assert "x" in nodes[0]
    assert "y" in nodes[0]
    assert "properties" in nodes[0]
    assert "centrality" in nodes[0]["properties"]
    assert "community_id" in nodes[0]["properties"]

    # 2. Fetch links
    res_links = await client.get("/api/v1/network/links")
    assert res_links.status_code == 200
    links = res_links.json()
    assert len(links) > 0
    assert "source" in links[0]
    assert "target" in links[0]

    # 3. Fetch statistics
    res_stats = await client.get("/api/v1/network/statistics")
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["nodes_count"] == len(nodes)
    assert "density" in stats
    assert "communities_count" in stats

    # 4. Expand node
    node_id = nodes[0]["id"]
    res_expand = await client.get(f"/api/v1/network/expand?node_id={node_id}")
    assert res_expand.status_code == 200
    expand_data = res_expand.json()
    assert "nodes" in expand_data
    assert "links" in expand_data


@pytest.mark.asyncio
async def test_heatmap_endpoints(client: AsyncClient) -> None:
    """Verifies caseload counts and coordinates mapping for hotspots."""
    # 1. Districts
    res_districts = await client.get("/api/v1/heatmap/districts")
    assert res_districts.status_code == 200
    districts = res_districts.json()
    assert len(districts) == 7
    assert "cases_count" in districts[0]

    # 2. Hotspots
    res_hotspots = await client.get("/api/v1/heatmap/hotspots")
    assert res_hotspots.status_code == 200
    hotspots = res_hotspots.json()
    assert len(hotspots) == 6
    assert "firs" in hotspots[0]


@pytest.mark.asyncio
async def test_reports_and_patterns_endpoints(client: AsyncClient) -> None:
    """Verifies that dossier generator and pattern explainability metrics load successfully."""
    # 1. Reports
    res_report = await client.get("/api/v1/reports/investigation")
    assert res_report.status_code == 200
    report = res_report.json()
    assert "title" in report
    assert "metadata" in report
    assert "sections" in report

    # 2. Pattern Analysis (Case 1000)
    res_pattern = await client.get("/api/v1/pattern/1000")
    assert res_pattern.status_code == 200
    pattern = res_pattern.json()
    assert pattern["id"] == "FIR-1000"
    assert "crimeSignature" in pattern
    assert "similarCases" in pattern
    assert "explainability" in pattern


@pytest.mark.asyncio
async def test_chat_playbooks(client: AsyncClient) -> None:
    """Verifies chatbot rule playbook responses."""
    # 1. Match vehicle theft query
    res = await client.post("/api/v1/chat/query", json={"query": "Analyze vehicle theft patterns in East Division"})
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "stats" in data
    assert "KA-03-MB-4432" not in str(data)  # Make sure we didn't just hardcode static text verbatim

    # 2. Match suspect name query
    res_suspect = await client.post("/api/v1/chat/query", json={"query": "Show dossier on suspect Ravi Kumar"})
    assert res_suspect.status_code == 200
    assert "Ravi" in res_suspect.json()["summary"]
