"""
CrimeLens AI — End-to-End System Integration Demonstration

Demonstrates the complete Machine Learning query flow:
Raw FIR -> Ingestion/Validation -> Signature Pipeline -> Embeddings ->
FAISS Index Search -> Query Self-Exclusion -> Hybrid Similarity Re-ranking -> Top-10.
"""

from __future__ import annotations

import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Dynamic path injection for monorepo imports
current_file = Path(__file__).resolve()
monorepo_root = current_file.parents[1]
sys.path.append(Monorepo_root := str(monorepo_root / "backend"))
sys.path.append(str(monorepo_root / "backend" / "app"))
sys.path.append(Monorepo_root)

from app.domain.models.ingested_case import Accused, ActSection, Complainant, IngestedCase, Victim
from app.services.crime_signature.core import create_default_pipeline
from app.services.crime_signature.embedding.orchestrator import EmbeddingOrchestrator
from app.services.crime_signature.pipeline.executor import PipelineExecutor
from app.services.crime_signature.retrieval import CrimeMetadata, IndexManager
from app.services.crime_signature.retrieval.search_engine import SearchEngine
from app.services.crime_signature.similarity.engine import SimilarityEngine


def generate_synthetic_dataset() -> list[IngestedCase]:
    """Generates 25 highly realistic, unique synthetic FIR cases within Karnataka boundaries."""
    cases = []
    
    # Core templates
    templates = [
        {
            "major": "Crimes Against Property", "minor": "Vehicle Theft", "gravity": "Heinous",
            "acts": [("IPC", "379"), ("IPC", "34")],
            "facts": "A two-wheeler, Royal Enfield Bullet, black in color, was stolen from outside the owner's residence during night hours by breaking the handle lock.",
            "zone": "URBAN RESIDENTIAL",
        },
        {
            "major": "Crimes Against Property", "minor": "House Breaking By Day", "gravity": "Heinous",
            "acts": [("IPC", "454"), ("IPC", "380")],
            "facts": "Unknown suspects entered a locked house during daytime by breaking the lock of the main gate, and stole gold ornaments and cash stored in the cupboard.",
            "zone": "URBAN METROPOLITAN",
        },
        {
            "major": "Cyber Crimes", "minor": "Online Bank Fraud", "gravity": "Non-Heinous",
            "acts": [("IT Act", "66D"), ("IPC", "420")],
            "facts": "The victim was cheated of Rs 75,000 by an unknown caller posing as a bank executive, who induced them to share credit card details and OTP coordinates.",
            "zone": "COMMERCIAL ZONE",
        },
        {
            "major": "Crimes Against Person", "minor": "Simple Hurt", "gravity": "Non-Heinous",
            "acts": [("IPC", "323"), ("IPC", "504")],
            "facts": "A physical fight occurred between neighbors over a minor water pipeline leakage dispute. The accused verbally abused and assaulted the complainant.",
            "zone": "RURAL ZONE",
        },
        {
            "major": "Crimes Against Property", "minor": "Dacoity", "gravity": "Heinous",
            "acts": [("IPC", "395"), ("IPC", "397")],
            "facts": "A gang of 5 masked suspects intercepted a logistics truck carrying electronic items on the highway, threatened the driver with weapons, and fled with the cargo.",
            "zone": "HIGHWAY HYBRID",
        }
    ]

    random.seed(42)
    start_date = datetime(2026, 6, 1)

    for i in range(25):
        case_id = 1000 + i
        # 18-digit unique CrimeNo (1-digit Category + 4-digit District + 4-digit PS + 4-digit Year + 5-digit Serial)
        district_id = 1000 + (i % 5)
        ps_id = 400 + (i % 3)
        crime_no = f"1{district_id}{ps_id:04d}2026{i:05d}"

        # Choose a template
        template = templates[i % len(templates)]
        
        # Vary dates
        inc_days = i * 2
        inc_from = start_date + timedelta(days=inc_days, hours=i % 24)
        info_rec = inc_from + timedelta(hours=(i % 5) + 1)

        # Vary locations inside Karnataka State boundaries (approx 11.5N to 18.5N, 74.0E to 78.5E)
        lat = 12.97 + (i * 0.05)
        lon = 77.59 + (i * 0.02)
        
        # Format statutory charges
        charges = [ActSection(act_code=act, section_code=sec) for act, sec in template["acts"]]

        # Assemble Case
        cases.append(
            IngestedCase(
                case_master_id=case_id,
                crime_no=crime_no,
                case_category="FIR",
                gravity_offence=template["gravity"],
                crime_major_head=template["major"],
                crime_minor_head=template["minor"],
                police_station_id=ps_id,
                incident_date_from=inc_from,
                incident_date_to=inc_from + timedelta(minutes=30),
                info_received_ps_date=info_rec,
                latitude=round(lat, 4),
                longitude=round(lon, 4),
                brief_facts=f"FIR serial {crime_no}: {template['facts']}",
                complainant=Complainant(age=25 + i, gender_id=1, occupation="Business"),
                victims=[Victim(age=30 + i, gender_id=1, is_police=False)],
                accused_list=[Accused(age=22 + i, gender_id=1, person_sequence="A1")],
                statutory_charges=charges,
            )
        )

    return cases


def main() -> None:
    print("=" * 80)
    print("CrimeLens AI — System Integration Demonstration (End-to-End)")
    print("=" * 80)

    # 1. Generate synthetic raw FIR records
    raw_fir_cases = generate_synthetic_dataset()
    print(f"Successfully generated {len(raw_fir_cases)} synthetic FIR cases.")

    # 2. Run Crime Signature Pipeline (Validation -> Features -> Assembly)
    print("\nRunning Ingested Cases through Feature Engineering Pipeline...")
    sig_pipeline = create_default_pipeline()
    
    signatures = []
    for raw_case in raw_fir_cases:
        sig, context = sig_pipeline.execute(raw_case)
        signatures.append(sig)
    print(f"Generated {len(signatures)} anonymized Crime Signature profiles.")

    # 3. Setup Embedding Framework
    print("\nInitializing Pluggable Embedding Framework...")
    embedding_orchestrator = EmbeddingOrchestrator()

    # 4. Setup Vector Retrieval Search Index
    print("Initializing FAISS Vector Retrieval Search Index...")
    index_manager = IndexManager()
    index_manager.rebuild_index(dimension=384)

    vectors = []
    metadata_list = []

    # Map signatures to coordinates and metadata
    for idx, sig in enumerate(signatures):
        emb_res = embedding_orchestrator.get_embedding(sig, model_name="minilm")
        vectors.append(emb_res.embedding_vector)
        metadata_list.append(
            CrimeMetadata(
                case_id=sig.case_master_id,
                crime_signature_hash=emb_res.crime_signature_hash,
                embedding_version=emb_res.embedding_version.model_version,
                pipeline_version=emb_res.embedding_version.pipeline_version,
                feature_version=emb_res.embedding_version.feature_version,
                creation_timestamp=datetime.now(timezone.utc),
            )
        )

    # Seed Index Manager
    index_manager.add_documents(vectors, metadata_list)
    search_engine = SearchEngine(manager=index_manager)
    similarity_engine = SimilarityEngine()

    # 5. Setup Integrated Pipeline Executor
    print("Assembling integrated CrimeAnalysisPipeline...")
    executor = PipelineExecutor()
    executor.pipeline.embedding_orchestrator = embedding_orchestrator
    executor.pipeline.search_engine = search_engine
    executor.pipeline.similarity_engine = similarity_engine

    # 6. Choose a query FIR (Case 1000: Vehicle Theft)
    query_fir = raw_fir_cases[0]
    query_sig, _ = sig_pipeline.execute(query_fir)

    # Execute integrated search re-ranking pipeline
    candidate_lookup = {sig.case_master_id: sig for sig in signatures}
    
    print("\nExecuting End-to-End Query Analysis (Top-20 Retrieve -> Top-10 Rank)...")
    result = executor.run(
        query_signature=query_sig,
        candidate_resolver=candidate_lookup,
        model_name="minilm",
        top_k=20,
    )

    # 7. Print pipeline steps in sequence:
    # (a) Query FIR
    print("\n" + "=" * 80)
    print("STEP 1: QUERY FIR DETAILS")
    print("=" * 80)
    print(f"Case ID : {query_fir.case_master_id}")
    print(f"Narrative   : {query_fir.brief_facts}")
    print(f"Statutory Charges : {[f'{c.act_code} {c.section_code}' for c in query_fir.statutory_charges]}")

    # (b) Retrieved Candidates
    print("\n" + "=" * 80)
    print("STEP 2: RETRIEVED CANDIDATES FROM FAISS INDEX SEARCH (Top-20)")
    print("=" * 80)
    # We query FAISS directly to display raw output before exclusions
    emb_val = embedding_orchestrator.get_embedding(query_sig, "minilm").embedding_vector
    raw_retrieved = search_engine.search(emb_val, k=20)
    print(f"{'Retrieved Rank':<15} | {'Case ID':<8} | {'FAISS Score'}")
    print("-" * 50)
    for idx, r in enumerate(raw_retrieved.results):
        print(f"{idx + 1:<15} | {r.case_id:<8} | {r.score:.4f}")

    # (c) Filtered Candidates
    print("\n" + "=" * 80)
    print("STEP 3: FILTERED CANDIDATES (Query Self-Exclusion Applied)")
    print("=" * 80)
    query_id = query_fir.case_master_id
    filtered = [r for r in raw_retrieved.results if r.case_id != query_id]
    print(f"Excluding Query Case ID {query_id}...")
    print(f"{'Filtered Rank':<15} | {'Case ID':<8} | {'FAISS Score'}")
    print("-" * 50)
    for idx, r in enumerate(filtered[:20]):
        print(f"{idx + 1:<15} | {r.case_id:<8} | {r.score:.4f}")

    # (d) Ranked Results, Confidence, and Timings
    print("\n" + "=" * 80)
    print("STEP 4: HYBRID SIMILARITY RANKING & CONFIDENCE SCORE (Top-10)")
    print("=" * 80)
    print(f"{'Rank':<5} | {'Case ID':<8} | {'Similarity':<10} | {'Confidence':<10} | {'Rationale'}")
    print("-" * 80)
    for idx, match in enumerate(result.top_similar_crimes[:10]):
        print(
            f"{idx + 1:<5} | "
            f"{match.case_id:<8} | "
            f"{match.overall_similarity:<10.3f} | "
            f"{match.confidence:<10.3f} | "
            f"{match.explanation.rationale}"
        )

    # (e) Execution Time
    print("\n" + "=" * 80)
    print("STEP 5: PERFORMANCE EXECUTION TIMES")
    print("=" * 80)
    for stage, duration in result.processing_times_ms.items():
        print(f"  - {stage:<25}: {duration:>6.2f} ms")

    print("\n[Detailed Match Rationales]")
    for match in result.top_similar_crimes[:3]:
        print(f"\n* Case ID: {match.case_id} (Similarity: {match.overall_similarity:.3f}, Confidence: {match.confidence:.3f})")
        for key, details in match.explanation.comparator_explanations.items():
            print(f"  - {key:<15}: {details}")

    print("=" * 80)
    print("CrimeLens AI — System Integration Demonstration execution complete!")
    print("=" * 80)


if __name__ == "__main__":
    main()
