"""
CrimeLens AI — Pipeline Executor

Wrapper interface mapping the pipeline orchestrator to runtime commands.
"""

from __future__ import annotations

from typing import Callable, Dict, Optional, Union

from app.domain.models.signature import CrimeSignature
from app.services.crime_signature.pipeline.models import PipelineResult
from app.services.crime_signature.pipeline.orchestrator import CrimeAnalysisPipeline


class PipelineExecutor:
    """
    High-level executor providing the main entry point to initiate pipeline runs.
    """

    def __init__(self, pipeline: Optional[CrimeAnalysisPipeline] = None) -> None:
        self.pipeline = pipeline or CrimeAnalysisPipeline()

    def run(
        self,
        query_signature: CrimeSignature,
        candidate_resolver: Union[
            Dict[int, CrimeSignature], Callable[[int], Optional[CrimeSignature]]
        ],
        model_name: Optional[str] = None,
        top_k: Optional[int] = None,
    ) -> PipelineResult:
        """
        Executes end-to-end processing pipelines.

        Args:
            query_signature: The query CrimeSignature object.
            candidate_resolver: Dict map or function returning candidate signatures.
            model_name: Optional model override name.
            top_k: Optional search K results count override.

        Returns:
            The PipelineResult wrapper.
        """
        return self.pipeline.analyze(
            query_signature=query_signature,
            candidate_resolver=candidate_resolver,
            model_name=model_name,
            top_k=top_k,
        )
