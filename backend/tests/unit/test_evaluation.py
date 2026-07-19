"""
CrimeLens AI — Evaluation Framework Tests
"""

import pytest
from app.evaluation.metrics.ir_metrics import IRMetrics
from app.evaluation.benchmark.runner import BenchmarkRunner, EvaluationQuery

def test_recall_at_k():
    retrieved = [1, 2, 3, 4, 5]
    relevant = [3, 5, 9]
    # At K=2: retrieved [1, 2], hits=0
    assert IRMetrics.recall_at_k(retrieved, relevant, 2) == 0.0
    # At K=5: retrieved [1,2,3,4,5], hits=3,5 (2 hits), total_relevant=3
    assert IRMetrics.recall_at_k(retrieved, relevant, 5) == 2.0 / 3.0

def test_precision_at_k():
    retrieved = [1, 2, 3, 4, 5]
    relevant = [3, 5, 9]
    # At K=3: retrieved [1,2,3], hits=3 (1 hit), K=3
    assert IRMetrics.precision_at_k(retrieved, relevant, 3) == 1.0 / 3.0

def test_mean_reciprocal_rank():
    retrieved = [10, 20, 30]
    relevant = [30]
    # Rank of 30 is 3, MRR = 1/3
    assert pytest.approx(IRMetrics.mean_reciprocal_rank(retrieved, relevant)) == 0.333333

def test_average_precision():
    retrieved = [1, 2, 3, 4, 5]
    relevant = [1, 3] # Rank 1 and 3
    # AP = (1/1 + 2/3) / 2 = (1 + 0.666) / 2 = 0.8333
    assert pytest.approx(IRMetrics.average_precision(retrieved, relevant)) == 0.833333

def test_benchmark_runner():
    def mock_search(query: str) -> list[int]:
        if "theft" in query.lower():
            return [101, 102, 103, 104, 105]
        return [201, 202, 203]

    runner = BenchmarkRunner(mock_search)
    queries = [
        EvaluationQuery(query_text="car theft", expected_relevant_case_ids=[101, 105]),
        EvaluationQuery(query_text="murder", expected_relevant_case_ids=[201])
    ]
    
    result = runner.run_benchmark("MockModel", queries)
    assert result.model_name == "MockModel"
    assert result.throughput_qps >= 0
    assert result.mrr > 0
