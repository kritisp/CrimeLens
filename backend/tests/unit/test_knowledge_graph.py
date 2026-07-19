"""
CrimeLens AI — Knowledge Graph Domain Tests
"""

from datetime import datetime, timezone
import pytest

from app.domain.models.ingested_case import IngestedCase, ActSection as RawActSection
from app.services.crime_signature_v2.builder import SignatureBuilder
from app.domain.knowledge_graph.builder import GraphBuilder


@pytest.fixture
def sample_ingested_case() -> IngestedCase:
    return IngestedCase(
        case_master_id=999,
        crime_no="000000000000000999",
        case_category="FIR",
        gravity_offence="Heinous",
        crime_major_head="MURDER",
        crime_minor_head="MURDER FOR GAIN",
        police_station_id=10,
        incident_date_from=datetime(2023, 1, 1, 23, 0, tzinfo=timezone.utc),
        info_received_ps_date=datetime(2023, 1, 2, 8, 0, tzinfo=timezone.utc),
        latitude=13.0,
        longitude=77.0,
        brief_facts="Accused gang members used a knife to commit murder during the night.",
        statutory_charges=[
            RawActSection(act_code="IPC", section_code="302"),
            RawActSection(act_code="IPC", section_code="34")
        ],
        victims=[],
        accused_list=[]
    )

def test_graph_builder_generation(sample_ingested_case: IngestedCase):
    # 1. Generate Signature
    sig_builder = SignatureBuilder()
    sig = sig_builder.build_from_case(sample_ingested_case)

    # 2. Generate Graph
    graph_builder = GraphBuilder()
    graph = graph_builder.build_from_signature(sig)

    # Verify Nodes
    node_labels = [n.label for n in graph.nodes]
    assert "Crime" in node_labels
    assert "PoliceStation" in node_labels
    assert "LegalSection" in node_labels
    assert "BehaviorCluster" in node_labels
    
    # Check that both IPC 302 and IPC 34 created LegalSection nodes
    legal_nodes = [n for n in graph.nodes if n.label == "LegalSection"]
    assert len(legal_nodes) == 2

    # Verify Edges
    edge_types = [e.relationship_type for e in graph.edges]
    assert "CRIME_OCCURRED_AT" in edge_types
    assert "CRIME_CHARGED_UNDER" in edge_types
    assert "CRIME_EXHIBITS_BEHAVIOR" in edge_types

    # Verify specific edge linking Crime to PS 10
    ps_edge = next(e for e in graph.edges if e.relationship_type == "CRIME_OCCURRED_AT")
    assert ps_edge.source_id == "CRIME_000000000000000999"
    assert ps_edge.target_id == "PS_10"
