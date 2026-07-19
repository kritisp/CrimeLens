"""
CrimeLens AI — API Analysis End-to-End Integration Tests

Verifies REST API endpoints routing correctness, request validation rules,
error response mappings, headers propagation, and metrics trackers.
"""

from __future__ import annotations

from http import HTTPStatus

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_analyze_by_existing_case_id(client: AsyncClient) -> None:
    """Verifies querying /analyze using a valid pre-seeded Case ID."""
    response = await client.post(
        "/api/v1/analysis/analyze",
        json={"case_id": 1000},
    )

    assert response.status_code == HTTPStatus.OK.value
    data = response.json()

    # Validate response schema structure
    assert "query_case" in data
    assert "similar_cases" in data
    assert "performance" in data

    assert data["query_case"]["case_master_id"] == 1000
    assert "crime_no" in data["query_case"]
    assert "brief_facts" in data["query_case"]

    # Verify query self-exclusion (1000 must NOT be in similar_cases)
    similar_ids = [int(item["case_id"]) for item in data["similar_cases"]]
    assert 1000 not in similar_ids

    # Validate performance metrics structure
    perf = data["performance"]
    assert "embedding_ms" in perf
    assert "retrieval_ms" in perf
    assert "ranking_ms" in perf
    assert "total_ms" in perf

    # Assert timing middleware headers are propagated
    assert "X-Request-ID" in response.headers
    assert "X-Process-Time" in response.headers


@pytest.mark.asyncio
async def test_analyze_by_raw_payload(client: AsyncClient) -> None:
    """Verifies querying /analyze using dynamic raw Case / FIR dict payload logs."""
    raw_payload = {
        "case_master_id": 1099,
        "crime_no": "110000400202600000",
        "case_category": "FIR",
        "gravity_offence": "Heinous",
        "crime_major_head": "Crimes Against Property",
        "crime_minor_head": "Vehicle Theft",
        "police_station_id": 401,
        "incident_date_from": "2026-06-01T00:00:00",
        "info_received_ps_date": "2026-06-01T02:00:00",
        "latitude": 12.97,
        "longitude": 77.59,
        "brief_facts": "A black Royal Enfield Bullet was stolen outside residence.",
        "complainant": {"age": 25, "gender_id": 1, "occupation": "Business"},
        "victims": [{"age": 30, "gender_id": 1, "is_police": False}],
        "accused_list": [{"age": 22, "gender_id": 1, "person_sequence": "A1"}],
        "statutory_charges": [{"act_code": "IPC", "section_code": "379"}]
    }

    response = await client.post(
        "/api/v1/analysis/analyze",
        json={"raw_payload": raw_payload},
    )

    assert response.status_code == HTTPStatus.OK.value
    data = response.json()
    assert data["query_case"]["case_master_id"] == 1099
    assert len(data["similar_cases"]) >= 1


@pytest.mark.asyncio
async def test_analyze_validation_errors(client: AsyncClient) -> None:
    """Verifies invalid payloads trigger HTTP 400 Bad Requests."""
    # Scenario A: Both case_id and raw_payload provided
    response = await client.post(
        "/api/v1/analysis/analyze",
        json={"case_id": 1000, "raw_payload": {}},
    )
    assert response.status_code == HTTPStatus.BAD_REQUEST.value
    assert "Provide either 'case_id' or 'raw_payload'" in response.json()["detail"]

    # Scenario B: Neither provided
    response = await client.post(
        "/api/v1/analysis/analyze",
        json={},
    )
    assert response.status_code == HTTPStatus.BAD_REQUEST.value

    # Scenario C: Non-existent Case ID
    response = await client.post(
        "/api/v1/analysis/analyze",
        json={"case_id": 9999},
    )
    assert response.status_code == HTTPStatus.NOT_FOUND.value


@pytest.mark.asyncio
async def test_metrics_updates_cumulatively(client: AsyncClient) -> None:
    """Verifies that statistics counters increment with each analysis query run."""
    # 1. Fetch initial statistics
    res1 = await client.get("/api/v1/analysis/metrics")
    assert res1.status_code == HTTPStatus.OK.value
    data1 = res1.json()
    initial_count = data1["total_analyses"]

    # 2. Trigger an analysis
    await client.post(
        "/api/v1/analysis/analyze",
        json={"case_id": 1001},
    )

    # 3. Assert statistics total analysis incremented
    res2 = await client.get("/api/v1/analysis/metrics")
    data2 = res2.json()
    assert data2["total_analyses"] == initial_count + 1
    assert data2["average_latency_ms"] >= 0.0
    assert data2["index_size"] == 25
    assert data2["model_version"] == "minilm"
