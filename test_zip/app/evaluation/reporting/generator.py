"""
CrimeLens AI — Report Generator

Produces human-readable and machine-readable reports of the dataset
statistics and benchmark results.
"""

from typing import List, Dict, Any
import json
from datetime import datetime

from app.evaluation.benchmark.runner import BenchmarkResult


class ReportGenerator:
    """Generates evaluation reports in multiple formats."""

    @staticmethod
    def _format_markdown(results: List[BenchmarkResult], dataset_stats: Dict[str, Any]) -> str:
        md = f"# CrimeLens AI — Evaluation Report\n\n"
        md += f"**Generated At**: {datetime.utcnow().isoformat()}Z\n\n"
        
        md += f"## 1. Dataset Statistics\n"
        md += f"- **Total Cases**: {dataset_stats.get('total_cases')}\n"
        md += f"- **Missing Coordinates**: {dataset_stats.get('missing_coordinates_count')}\n\n"
        
        md += f"## 2. Benchmark Results\n\n"
        md += "| Model | Recall@5 | Recall@10 | MRR | MAP | NDCG@10 | Latency (ms) | QPS |\n"
        md += "|-------|----------|-----------|-----|-----|---------|--------------|-----|\n"
        
        for r in results:
            md += (
                f"| {r.model_name} | {r.recall_at_5:.3f} | {r.recall_at_10:.3f} | "
                f"{r.mrr:.3f} | {r.map_score:.3f} | {r.ndcg_at_10:.3f} | "
                f"{r.avg_latency_ms:.1f} | {r.throughput_qps:.1f} |\n"
            )
            
        return md

    @staticmethod
    def generate_markdown(results: List[BenchmarkResult], dataset_stats: Dict[str, Any], filepath: str):
        content = ReportGenerator._format_markdown(results, dataset_stats)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    @staticmethod
    def generate_json(results: List[BenchmarkResult], dataset_stats: Dict[str, Any], filepath: str):
        data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "dataset_stats": dataset_stats,
            "benchmarks": [r.model_dump() for r in results]
        }
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)

    @staticmethod
    def generate_html(results: List[BenchmarkResult], dataset_stats: Dict[str, Any], filepath: str):
        html = f"""
        <html>
        <head>
            <title>CrimeLens Evaluation Report</title>
            <style>
                body {{ font-family: sans-serif; margin: 40px; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <h1>CrimeLens AI — Evaluation Report</h1>
            <h2>1. Dataset Statistics</h2>
            <ul>
                <li><strong>Total Cases:</strong> {dataset_stats.get('total_cases')}</li>
                <li><strong>Missing Coordinates:</strong> {dataset_stats.get('missing_coordinates_count')}</li>
            </ul>
            <h2>2. Benchmark Results</h2>
            <table>
                <tr>
                    <th>Model</th>
                    <th>Recall@5</th>
                    <th>Recall@10</th>
                    <th>MRR</th>
                    <th>MAP</th>
                    <th>NDCG@10</th>
                    <th>Latency (ms)</th>
                    <th>QPS</th>
                </tr>
        """
        for r in results:
            html += f"""
                <tr>
                    <td>{r.model_name}</td>
                    <td>{r.recall_at_5:.3f}</td>
                    <td>{r.recall_at_10:.3f}</td>
                    <td>{r.mrr:.3f}</td>
                    <td>{r.map_score:.3f}</td>
                    <td>{r.ndcg_at_10:.3f}</td>
                    <td>{r.avg_latency_ms:.1f}</td>
                    <td>{r.throughput_qps:.1f}</td>
                </tr>
            """
        html += """
            </table>
        </body>
        </html>
        """
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
