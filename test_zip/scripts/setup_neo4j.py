"""
CrimeLens AI — Neo4j Database Setup & Seeding Script

This script generates indices, unique constraints, and Cypher seed statements
for initial schema configuration of a Neo4j Knowledge Graph.
"""

from __future__ import annotations

import os
import sys

# Add backend directory to Python path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.synthetic import generate_synthetic_dataset
from app.services.crime_signature_v2.builder import SignatureBuilder
from app.domain.knowledge_graph.builder import GraphBuilder


def main():
    print("====================================================")
    print("CrimeLens AI — Generating Neo4j Setup Constraints")
    print("====================================================\n")

    # 1. Define schema constraints
    schema_queries = [
        "CREATE CONSTRAINT FOR (c:CrimeCase) REQUIRE c.id IS UNIQUE;",
        "CREATE CONSTRAINT FOR (a:Accused) REQUIRE a.name IS UNIQUE;",
        "CREATE CONSTRAINT FOR (v:Victim) REQUIRE v.id IS UNIQUE;",
        "CREATE INDEX FOR (c:CrimeCase) ON (c.crime_no);",
        "CREATE INDEX FOR (c:CrimeCase) ON (c.major_head, c.minor_head);"
    ]

    print("// --- SCHEMA DEFINITION COMMANDS ---")
    for q in schema_queries:
        print(q)
    print()

    # 2. Extract nodes and edges from synthetic dataset
    print("// --- SEED DATA INGESTION TRANSACTIONS ---")
    cases = generate_synthetic_dataset()
    sig_builder = SignatureBuilder()
    graph_builder = GraphBuilder()

    for idx, case in enumerate(cases):
        sig = sig_builder.build_from_case(case)
        schema = graph_builder.build_from_signature(sig)

        print(f"\n// Ingesting Case FIR-{case.case_master_id} (No: {case.crime_no})")
        
        # Merge Nodes
        for node in schema.nodes:
            label = node.label
            props = ", ".join([f"{k}: '{v}'" if isinstance(v, str) else f"{k}: {v}" for k, v in node.properties.items()])
            print(f"MERGE (n:{label} {{id: '{node.node_id}'}}) ON CREATE SET n += {{{props}}};")

        # Merge Edges
        for edge in schema.edges:
            weight = edge.weight or 1.0
            print(
                f"MATCH (s {{id: '{edge.source_id}'}}), (t {{id: '{edge.target_id}'}}) "
                f"MERGE (s)-[r:{edge.relationship_type}]->(t) "
                f"ON CREATE SET r.weight = {weight};"
            )

    print("\n====================================================")
    print("Neo4j Setup & Seeding Script Compilation Complete.")
    print("====================================================")


if __name__ == "__main__":
    main()
