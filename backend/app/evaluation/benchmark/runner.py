"""
CrimeLens AI — Benchmark Runner

Orchestrates the evaluation of the semantic retrieval engine against 
different embedding models and datasets.
"""

import time
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from app.evaluation.metrics.ir_metrics import IRMetrics


class EvaluationQuery(BaseModel):
    """Ground Truth model representing a query and its known relevant results."""
    query_text: str = Field(..., description="The query string or semantic document to search.")
    expected_relevant_case_ids: List[int] = Field(..., description="Known relevant case IDs (Ground Truth).")


class BenchmarkResult(BaseModel):
    """Container for the aggregated evaluation metrics of a single model."""
    model_name: str
    recall_at_5: float
    recall_at_10: float
    precision_at_5: float
    precision_at_10: float
    mrr: float
    map_score: float
    ndcg_at_10: float
    avg_latency_ms: float
    throughput_qps: float


class BenchmarkRunner:
    """Runs a benchmark suite for a specific embedding model interface."""

    def __init__(self, mock_search_fn):
        """
        Takes a callable `mock_search_fn(query_text: str) -> List[int]`
        representing the retrieval engine.
        """
        self.search_fn = mock_search_fn

    def run_benchmark(self, model_name: str, queries: List[EvaluationQuery]) -> BenchmarkResult:
        
        start_time = time.time()
        
        total_r5 = 0.0
        total_r10 = 0.0
        total_p5 = 0.0
        total_p10 = 0.0
        total_mrr = 0.0
        total_ap = 0.0
        total_ndcg10 = 0.0
        
        latencies = []
        
        for q in queries:
            # Execute search
            q_start = time.time()
            retrieved_ids = self.search_fn(q.query_text)
            latencies.append((time.time() - q_start) * 1000)
            
            # Compute Metrics
            total_r5 += IRMetrics.recall_at_k(retrieved_ids, q.expected_relevant_case_ids, 5)
            total_r10 += IRMetrics.recall_at_k(retrieved_ids, q.expected_relevant_case_ids, 10)
            total_p5 += IRMetrics.precision_at_k(retrieved_ids, q.expected_relevant_case_ids, 5)
            total_p10 += IRMetrics.precision_at_k(retrieved_ids, q.expected_relevant_case_ids, 10)
            total_mrr += IRMetrics.mean_reciprocal_rank(retrieved_ids, q.expected_relevant_case_ids)
            total_ap += IRMetrics.average_precision(retrieved_ids, q.expected_relevant_case_ids)
            total_ndcg10 += IRMetrics.ndcg_at_k(retrieved_ids, q.expected_relevant_case_ids, 10)
            
        n = len(queries)
        total_time = time.time() - start_time
        avg_latency = sum(latencies) / n if n > 0 else 0
        throughput = n / total_time if total_time > 0 else 0

        return BenchmarkResult(
            model_name=model_name,
            recall_at_5=total_r5 / n if n else 0,
            recall_at_10=total_r10 / n if n else 0,
            precision_at_5=total_p5 / n if n else 0,
            precision_at_10=total_p10 / n if n else 0,
            mrr=total_mrr / n if n else 0,
            map_score=total_ap / n if n else 0,
            ndcg_at_10=total_ndcg10 / n if n else 0,
            avg_latency_ms=avg_latency,
            throughput_qps=throughput
        )
