"""
CrimeLens AI — Real Model Evaluation & Benchmark Script

Executes the evaluation suite on actual pipeline embeddings across MiniLM, BGE, and E5 model strategy configurations.
Generates metrics: Recall@5, Recall@10, Precision@5, Precision@10, MRR, MAP, NDCG@10, Latency (ms), and Throughput (QPS).
"""

from __future__ import annotations

import os
import sys
import time
from datetime import datetime, timezone

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.synthetic import generate_synthetic_dataset
from app.domain.models.signature import (
    CrimeSignature,
    StructuredFeatures,
    TextFeatures,
    TemporalFeatures,
    SpatialFeatures,
    DerivedFeatures,
    BehavioralFeatures,
)
from app.evaluation.benchmark.runner import BenchmarkRunner, EvaluationQuery
from app.evaluation.reporting.generator import ReportGenerator
from app.services.crime_signature.core import create_default_pipeline
from app.services.crime_signature.embedding.orchestrator import EmbeddingOrchestrator
from app.services.crime_signature.retrieval import IndexManager, CrimeMetadata, SearchEngine


def main():
    print("====================================================")
    print("CrimeLens AI — Evaluation & Benchmark Execution Engine")
    print("====================================================\n")

    # 1. Load synthetic dataset
    cases = generate_synthetic_dataset()
    print(f"Loaded {len(cases)} synthetic ground-truth FIR cases.")

    # 2. Extract signatures
    pipeline = create_default_pipeline()
    signatures = {}
    for case in cases:
        sig, _ = pipeline.execute(case)
        signatures[case.case_master_id] = sig

    # 3. Formulate ground-truth evaluation queries (matching synthetic templates)
    queries = [
        EvaluationQuery(
            query_text="Royal Enfield Bullet stolen during night hours by breaking handle lock",
            expected_relevant_case_ids=[1000, 1005, 1010, 1015, 1020]
        ),
        EvaluationQuery(
            query_text="House breaking daytime main gate lock broken gold ornaments cash stolen",
            expected_relevant_case_ids=[1001, 1006, 1011, 1016, 1021]
        ),
        EvaluationQuery(
            query_text="Online bank fraud fake bank executive credit card OTP cheated Rs 75000",
            expected_relevant_case_ids=[1002, 1007, 1012, 1017, 1022]
        ),
        EvaluationQuery(
            query_text="Physical fight neighbor water pipeline leakage verbal abuse assault",
            expected_relevant_case_ids=[1003, 1008, 1013, 1018, 1023]
        ),
        EvaluationQuery(
            query_text="Dacoity highway logistics truck electronic items cargo weapons robbery",
            expected_relevant_case_ids=[1004, 1009, 1014, 1019, 1024]
        )
    ]

    models_to_test = [
        ("MiniLM-L6-v2", "minilm", 384),
        ("BGE-Small-EN-v1.5", "bge", 384),
        ("E5-Base", "e5", 768)
    ]

    emb_orchestrator = EmbeddingOrchestrator()
    results = []

    for label, model_code, dim in models_to_test:
        print(f"\n--- Benchmarking Strategy: {label} (Code: '{model_code}', Dim: {dim}) ---")

        # Create temporary vector index for target dimension
        idx_manager = IndexManager()
        idx_manager.rebuild_index(dimension=dim)

        vectors = []
        metadata_list = []

        # Vectorize signatures
        for sig in signatures.values():
            emb_res = emb_orchestrator.get_embedding(sig, model_name=model_code)
            vectors.append(emb_res.embedding_vector)
            metadata_list.append(
                CrimeMetadata(
                    case_id=sig.case_master_id,
                    crime_signature_hash=emb_res.crime_signature_hash,
                    embedding_version="1.0.0",
                    pipeline_version="1.0.0",
                    feature_version="1.0.0",
                )
            )

        idx_manager.add_documents(vectors, metadata_list)
        search_engine = SearchEngine(manager=idx_manager)

        # Define model search closure
        def search_closure(query_text: str) -> list[int]:
            mock_query_sig = CrimeSignature(
                case_master_id=9999,
                crime_no="100000000000000000",
                structured=StructuredFeatures(
                    case_category="FIR", gravity_level="Non-Heinous", major_head="QUERY", minor_head="QUERY", police_station_id=0
                ),
                temporal=TemporalFeatures(hour_sin=0.0, hour_cos=0.0, day_sin=0.0, day_cos=0.0, is_holiday=False),
                spatial=SpatialFeatures(latitude=12.97, longitude=77.59, geohash_code="UNKNOWN", zone_classification="UNKNOWN"),
                text=TextFeatures(narrative_summary=query_text),
                derived=DerivedFeatures(reporting_delay_minutes=0, incident_duration_minutes=0, accused_count=0, victim_count=0),
                behavioral=BehavioralFeatures(modus_operandi_tags=[], repeat_offender_ratio=0.0, target_type="UNKNOWN")
            )
            q_emb = emb_orchestrator.get_embedding(mock_query_sig, model_name=model_code)
            search_res = search_engine.search(q_emb.embedding_vector, k=10)
            return [r.case_id for r in search_res.results]

        runner = BenchmarkRunner(search_closure)
        res = runner.run_benchmark(label, queries)
        results.append(res)
        print(f"Completed: Recall@5={res.recall_at_5:.2f}, MRR={res.mrr:.2f}, NDCG@10={res.ndcg_at_10:.2f}, Avg Latency={res.avg_latency_ms:.1f}ms")

    # 4. Generate Reports
    dataset_stats = {
        "total_cases": len(cases),
        "missing_coordinates_count": 0,
        "class_imbalances": {"Heinous": 15, "Non-Heinous": 10}
    }

    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "examples", "outputs", "reports"))
    os.makedirs(out_dir, exist_ok=True)

    md_path = os.path.join(out_dir, "report.md")
    html_path = os.path.join(out_dir, "report.html")
    json_path = os.path.join(out_dir, "report.json")

    ReportGenerator.generate_markdown(results, dataset_stats, md_path)
    ReportGenerator.generate_html(results, dataset_stats, html_path)
    ReportGenerator.generate_json(results, dataset_stats, json_path)

    print("\n====================================================")
    print(f"Benchmark Suite Execution Finished.")
    print(f"Reports Written To: {out_dir}")
    print("====================================================")


if __name__ == "__main__":
    main()
