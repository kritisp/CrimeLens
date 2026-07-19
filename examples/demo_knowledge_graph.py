"""
CrimeLens AI — Knowledge Graph Demo

Generates GraphSchema (Nodes and Edges) JSON payloads from mock IngestedCase records 
to demonstrate the extraction of the canonical graph structure.
"""

import os
from datetime import datetime, timezone

from app.domain.models.ingested_case import IngestedCase, ActSection
from app.services.crime_signature_v2.builder import SignatureBuilder
from app.domain.knowledge_graph.builder import GraphBuilder
from app.domain.knowledge_graph.serializer import GraphSerializer

def main():
    print("CrimeLens AI — Initializing Knowledge Graph Domain Demo...\n")

    sig_builder = SignatureBuilder()
    graph_builder = GraphBuilder()

    # 1. Theft Case
    case_1 = IngestedCase(
        case_master_id=101,
        crime_no="123456789012345678",
        case_category="FIR",
        gravity_offence="Heinous",
        crime_major_head="THEFT",
        crime_minor_head="MOTOR VEHICLE THEFT",
        police_station_id=1,
        incident_date_from=datetime(2023, 5, 1, 14, 0, tzinfo=timezone.utc),
        info_received_ps_date=datetime(2023, 5, 1, 16, 0, tzinfo=timezone.utc),
        latitude=12.9716,
        longitude=77.5946,
        brief_facts="The complainant parked his two-wheeler outside the shop. Unknown culprits broke the lock and stole the car.",
        statutory_charges=[ActSection(act_code="IPC", section_code="379")]
    )

    # 2. Assault Case
    case_2 = IngestedCase(
        case_master_id=102,
        crime_no="223456789012345678",
        case_category="FIR",
        gravity_offence="Heinous",
        crime_major_head="ASSAULT",
        crime_minor_head="ASSAULT WITH DEADLY WEAPON",
        police_station_id=2,
        incident_date_from=datetime(2023, 5, 2, 23, 0, tzinfo=timezone.utc),
        info_received_ps_date=datetime(2023, 5, 3, 1, 0, tzinfo=timezone.utc),
        latitude=13.0000,
        longitude=77.6000,
        brief_facts="Accused gang members attacked the victim with an iron rod near the highway during the night.",
        statutory_charges=[ActSection(act_code="IPC", section_code="324")]
    )

    # 3. Fraud Case
    case_3 = IngestedCase(
        case_master_id=103,
        crime_no="323456789012345678",
        case_category="FIR",
        gravity_offence="Non-Heinous",
        crime_major_head="CHEATING",
        crime_minor_head="CYBER FRAUD",
        police_station_id=3,
        incident_date_from=datetime(2023, 5, 5, 10, 0, tzinfo=timezone.utc),
        info_received_ps_date=datetime(2023, 5, 6, 10, 0, tzinfo=timezone.utc),
        latitude=12.9500,
        longitude=77.5500,
        brief_facts="Victim received a call promising lottery winnings. Transferred money via UPI.",
        statutory_charges=[ActSection(act_code="IPC", section_code="420"), ActSection(act_code="IT ACT", section_code="66D")]
    )

    cases = [case_1, case_2, case_3]
    output_dir = "examples/outputs/graph"
    os.makedirs(output_dir, exist_ok=True)

    for case in cases:
        print(f"Building Graph for Crime No: {case.crime_no} ({case.crime_major_head})")
        
        # Build Signature v2.1
        sig_v2 = sig_builder.build_from_case(case)
        
        # Build Graph Schema
        graph_schema = graph_builder.build_from_signature(sig_v2)
        
        # Serialize
        json_data = GraphSerializer.to_json(graph_schema)
        
        # Write to file
        output_file = os.path.join(output_dir, f"graph_{case.case_master_id}.json")
        with open(output_file, "w") as f:
            f.write(json_data)
            
        print(f"  -> Extracted {len(graph_schema.nodes)} Nodes and {len(graph_schema.edges)} Edges.")
        print(f"  -> Saved to {output_file}\n")

    print(f"Successfully generated 3 Knowledge Graph JSON payloads in '{output_dir}'.")

if __name__ == "__main__":
    main()
