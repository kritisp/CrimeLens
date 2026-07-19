"""
CrimeLens AI — End-to-End Crime Analysis Pipeline Demonstration

Loads sample CrimeSignature cases, generates dense embeddings, builds FAISS search
indexes, searches, computes composite similarity scores, and prints matched tables.
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

# Dynamic monorepo path injection to resolve app namespaces
current_file = Path(__file__).resolve()
monorepo_root = current_file.parents[1]
sys.path.append(str(monorepo_root / "backend"))
sys.path.append(str(monorepo_root / "backend" / "app"))
sys.path.append(str(monorepo_root))

from app.domain.models.signature import (
    BehavioralFeatures,
    CrimeSignature,
    DerivedFeatures,
    SpatialFeatures,
    StructuredFeatures,
    TemporalFeatures,
    TextFeatures,
)
from app.services.crime_signature.embedding.orchestrator import EmbeddingOrchestrator
from app.services.crime_signature.pipeline.executor import PipelineExecutor
from app.services.crime_signature.retrieval import CrimeMetadata, IndexManager
from app.services.crime_signature.retrieval.search_engine import SearchEngine
from app.services.crime_signature.similarity.engine import SimilarityEngine


def create_sample_signatures() -> list[CrimeSignature]:
    """Generates sample CrimeSignature instances for demonstration."""
    return [
        CrimeSignature(
            crime_no="104430006202600001",
            case_master_id=1001,
            structured=StructuredFeatures(
                case_category="FIR",
                gravity_level="Heinous",
                major_head="Crimes Against Property",
                minor_head="Vehicle Theft",
                police_station_id=443,
                statutory_charges=["IPC_379", "IPC_34"],
            ),
            temporal=TemporalFeatures(
                hour_sin=0.5,
                hour_cos=0.866,
                day_sin=0.0,
                day_cos=1.0,
                is_holiday=True,
            ),
            spatial=SpatialFeatures(
                latitude=12.9785,
                longitude=77.5946,
                geohash_code="tdr1wgd",
                zone_classification="URBAN METROPOLITAN",
            ),
            text=TextFeatures(
                narrative_summary="A white Hyundai Creta was stolen using a relay frequency bypass keyless device."
            ),
            derived=DerivedFeatures(
                reporting_delay_minutes=120,
                incident_duration_minutes=10,
                accused_count=2,
                victim_count=0,
            ),
            behavioral=BehavioralFeatures(
                modus_operandi_tags=["relay_bypass", "organized_syndicate"],
                repeat_offender_ratio=1.0,
                target_type="VEHICLE: HYUNDAI CRETA",
            ),
        ),
        CrimeSignature(
            crime_no="104430006202600002",
            case_master_id=1002,
            structured=StructuredFeatures(
                case_category="FIR",
                gravity_level="Heinous",
                major_head="Crimes Against Property",
                minor_head="Vehicle Theft",
                police_station_id=443,
                statutory_charges=["IPC_379", "IPC_34"],
            ),
            temporal=TemporalFeatures(
                hour_sin=0.5,
                hour_cos=0.866,
                day_sin=0.0,
                day_cos=1.0,
                is_holiday=True,
            ),
            spatial=SpatialFeatures(
                latitude=12.9780,
                longitude=77.5940,
                geohash_code="tdr1wgc",
                zone_classification="URBAN METROPOLITAN",
            ),
            text=TextFeatures(
                narrative_summary="Hyundai Creta vehicle stolen from driveway using keyless relay bypass frequencies."
            ),
            derived=DerivedFeatures(
                reporting_delay_minutes=60,
                incident_duration_minutes=15,
                accused_count=1,
                victim_count=0,
            ),
            behavioral=BehavioralFeatures(
                modus_operandi_tags=["relay_bypass", "masked_suspects"],
                repeat_offender_ratio=0.5,
                target_type="VEHICLE: HYUNDAI CRETA",
            ),
        ),
        # Disparate Crime Head example
        CrimeSignature(
            crime_no="104430006202600003",
            case_master_id=1003,
            structured=StructuredFeatures(
                case_category="FIR",
                gravity_level="Non-Heinous",
                major_head="Crimes Against Person",
                minor_head="Simple Hurt",
                police_station_id=443,
                statutory_charges=["IPC_323", "IPC_504"],
            ),
            temporal=TemporalFeatures(
                hour_sin=-0.707,
                hour_cos=-0.707,
                day_sin=-0.974,
                day_cos=-0.222,
                is_holiday=False,
            ),
            spatial=SpatialFeatures(
                latitude=12.9100,
                longitude=77.6200,
                geohash_code="tdr1tbf",
                zone_classification="COMMERCIAL ZONE",
            ),
            text=TextFeatures(
                narrative_summary="A physical altercation occurred in a parking lot following a verbal dispute."
            ),
            derived=DerivedFeatures(
                reporting_delay_minutes=30,
                incident_duration_minutes=5,
                accused_count=1,
                victim_count=1,
            ),
            behavioral=BehavioralFeatures(
                modus_operandi_tags=["verbal_dispute", "spontaneous_brawl"],
                repeat_offender_ratio=0.0,
                target_type="PERSON: CIVILIAN",
            ),
        ),
    ]


def main() -> None:
    print("=" * 75)
    print("CrimeLens AI — Crime Analysis Pipeline Demo Execution")
    print("=" * 75)

    # 1. Load sample signatures
    cases = create_sample_signatures()
    print(f"Loaded {len(cases)} sample Case Signatures.")

    # 2. Setup ML Engine Components
    print("Initializing Pluggable Embedding Framework...")
    embedding_orchestrator = EmbeddingOrchestrator()

    # Rebuild a fresh empty retrieval index
    print("Seeding Vector Retrieval Index...")
    index_manager = IndexManager()
    index_manager.rebuild_index(dimension=384)

    # Add candidates to search index
    vectors = []
    metadata_list = []
    
    # Generate embeddings and metadata for cases to seed search index
    for case in cases:
        # Generate query vector coordinates
        emb_res = embedding_orchestrator.get_embedding(case, model_name="minilm")
        vectors.append(emb_res.embedding_vector)
        
        metadata_list.append(
            CrimeMetadata(
                case_id=case.case_master_id,
                crime_signature_hash=emb_res.crime_signature_hash,
                embedding_version=emb_res.embedding_version.model_version,
                pipeline_version=emb_res.embedding_version.pipeline_version,
                feature_version=emb_res.embedding_version.feature_version,
                creation_timestamp=datetime.now(timezone.utc),
            )
        )

    # Seed index
    index_manager.add_documents(vectors, metadata_list)
    search_engine = SearchEngine(manager=index_manager)

    # 3. Setup Similarity Engine
    print("Initializing Hybrid Similarity Scorer...")
    similarity_engine = SimilarityEngine()

    # 4. Wires pipeline orchestrator
    print("Assembling integrated CrimeAnalysisPipeline...")
    executor = PipelineExecutor(
        pipeline=None  # Will lazily instantiate using the components we registered above
    )
    # Inject current configurations references to executors
    executor.pipeline.embedding_orchestrator = embedding_orchestrator
    executor.pipeline.search_engine = search_engine
    executor.pipeline.similarity_engine = similarity_engine

    # 5. Execute pipeline using Case 1001 as the query
    query_case = cases[0]
    candidate_lookup = {case.case_master_id: case for case in cases}

    print("-" * 75)
    print(f"QUERY CRIME Case ID: {query_case.case_master_id}")
    print(f"Query Narrative: {query_case.text.narrative_summary}")
    print("-" * 75)
    print("Running execution pipeline...")

    # Execute pipeline
    result = executor.run(
        query_signature=query_case,
        candidate_resolver=candidate_lookup,
        model_name="minilm",
        top_k=5,
    )

    # 6. Print Results Tables
    print("\n[Stage Execution Latencies]")
    for stage, duration in result.processing_times_ms.items():
        print(f"  - {stage:<25}: {duration:>6.2f} ms")

    print(f"\n[Re-ranked Candidate Results] (Total: {len(result.top_similar_crimes)})")
    print(f"{'Rank':<5} | {'Case ID':<8} | {'Similarity':<10} | {'Confidence':<10} | {'Rationale'}")
    print("-" * 75)
    
    for idx, match in enumerate(result.top_similar_crimes):
        print(
            f"{idx + 1:<5} | "
            f"{match.case_id:<8} | "
            f"{match.overall_similarity:<10.3f} | "
            f"{match.confidence:<10.2f} | "
            f"{match.explanation.rationale}"
        )

    print("\n[Match Explanations Details]")
    for match in result.top_similar_crimes:
        print(f"\n* Case ID: {match.case_id} (Score: {match.overall_similarity:.3f})")
        for key, details in match.explanation.comparator_explanations.items():
            print(f"  - {key:<15}: {details}")

    print("=" * 75)
    print("CrimeLens AI — Pipeline Demo complete successfully!")
    print("=" * 75)


if __name__ == "__main__":
    main()
