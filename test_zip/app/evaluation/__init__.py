"""
CrimeLens AI — Evaluation Framework
"""

from app.evaluation.dataset.loader import DatasetLoader, JSONLoader, CSVLoader, PostgreSQLLoader
from app.evaluation.dataset.validator import DatasetValidator, ValidationResult
from app.evaluation.dataset.statistics import DatasetStatistics
from app.evaluation.metrics.ir_metrics import IRMetrics
from app.evaluation.benchmark.runner import BenchmarkRunner, EvaluationQuery, BenchmarkResult
from app.evaluation.reporting.generator import ReportGenerator

__all__ = [
    "DatasetLoader",
    "JSONLoader",
    "CSVLoader",
    "PostgreSQLLoader",
    "DatasetValidator",
    "ValidationResult",
    "DatasetStatistics",
    "IRMetrics",
    "BenchmarkRunner",
    "EvaluationQuery",
    "BenchmarkResult",
    "ReportGenerator",
]
