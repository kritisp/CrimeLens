"""
CrimeLens AI — Benchmark Models Demo

Executes the evaluation suite on multiple simulated embedding models and
generates comparison reports.
"""

import os
from app.evaluation.benchmark.runner import BenchmarkRunner, EvaluationQuery
from app.evaluation.reporting.generator import ReportGenerator

def main():
    print("CrimeLens AI — Initializing Benchmark Demo...\n")

    queries = [
        EvaluationQuery(query_text="Vehicle theft at night", expected_relevant_case_ids=[1, 2, 3]),
        EvaluationQuery(query_text="Cyber fraud lottery", expected_relevant_case_ids=[4, 5]),
        EvaluationQuery(query_text="Armed robbery jewelry store", expected_relevant_case_ids=[6, 7, 8])
    ]

    # Mock search functions to simulate different model accuracies
    def search_minilm(query: str) -> list[int]:
        # Moderate performance
        if "theft" in query: return [1, 2, 99, 100]
        if "fraud" in query: return [4, 99, 100]
        return [6, 7, 99, 100]

    def search_bge(query: str) -> list[int]:
        # High performance
        if "theft" in query: return [1, 2, 3, 99]
        if "fraud" in query: return [4, 5, 99]
        return [6, 7, 8, 99]

    def search_e5(query: str) -> list[int]:
        # Low performance
        if "theft" in query: return [1, 99, 100, 101]
        if "fraud" in query: return [99, 100, 101]
        return [6, 99, 100, 101]

    models = [
        ("MiniLM-L6-v2", search_minilm),
        ("BGE-Small-EN-v1.5", search_bge),
        ("E5-Small-V2", search_e5)
    ]

    results = []
    for name, search_fn in models:
        print(f"Running benchmark for {name}...")
        runner = BenchmarkRunner(search_fn)
        result = runner.run_benchmark(name, queries)
        results.append(result)

    mock_stats = {
        "total_cases": 10000,
        "missing_coordinates_count": 50,
        "class_imbalances": {}
    }

    output_dir = "examples/outputs/reports"
    os.makedirs(output_dir, exist_ok=True)
    
    ReportGenerator.generate_markdown(results, mock_stats, os.path.join(output_dir, "report.md"))
    ReportGenerator.generate_html(results, mock_stats, os.path.join(output_dir, "report.html"))
    ReportGenerator.generate_json(results, mock_stats, os.path.join(output_dir, "report.json"))

    print(f"\nSuccessfully generated Benchmark Reports in '{output_dir}'.")

if __name__ == "__main__":
    main()
