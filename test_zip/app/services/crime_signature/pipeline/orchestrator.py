"""
CrimeLens AI — Crime Analysis Pipeline Orchestrator

Integrates Embedding Framework, Vector Retrieval Engine, and Hybrid Similarity Engine
into a single executable execution flow.
"""

from __future__ import annotations

import time
from typing import Callable, Dict, List, Optional, Union

import structlog

from app.domain.models.signature import CrimeSignature
from app.services.crime_signature.embedding.orchestrator import EmbeddingOrchestrator
from app.services.crime_signature.pipeline.context import PipelineContext
from app.services.crime_signature.pipeline.exceptions import ExecutionError
from app.services.crime_signature.pipeline.models import PipelineResult
from app.services.crime_signature.retrieval.search_engine import SearchEngine
from app.services.crime_signature.similarity.engine import SimilarityEngine

logger = structlog.get_logger("crime_analysis_pipeline")


class CrimeAnalysisPipeline:
    """
    Orchestrates the end-to-end processing pipeline, timing latency metrics,
    resolving candidate cases, and return matched results envelopes.
    """

    def __init__(
        self,
        embedding_orchestrator: Optional[EmbeddingOrchestrator] = None,
        search_engine: Optional[SearchEngine] = None,
        similarity_engine: Optional[SimilarityEngine] = None,
    ) -> None:
        self.embedding_orchestrator = embedding_orchestrator or EmbeddingOrchestrator()
        self.search_engine = search_engine or SearchEngine()
        self.similarity_engine = similarity_engine or SimilarityEngine()

    def analyze(
        self,
        query_signature: CrimeSignature,
        candidate_resolver: Union[
            Dict[int, CrimeSignature], Callable[[int], Optional[CrimeSignature]]
        ],
        model_name: Optional[str] = None,
        top_k: Optional[int] = None,
    ) -> PipelineResult:
        """
        Executes end-to-end crime analysis pipeline.

        Args:
            query_signature: The query CrimeSignature.
            candidate_resolver: A dict or callable resolving Case IDs to CrimeSignatures.
            model_name: Embedding model override code.
            top_k: Initial candidates retrieval pool size.

        Returns:
            The consolidated PipelineResult payload.

        Raises:
            ExecutionError: If execution fails at any stage.
        """
        context = PipelineContext()
        context.start_stage("total_pipeline")

        # 1. GENERATE QUERY EMBEDDING
        context.start_stage("embedding_generation")
        try:
            target_model = model_name or self.embedding_orchestrator.default_model_name
            emb_res = self.embedding_orchestrator.get_embedding(query_signature, target_model)
        except Exception as exc:
            logger.error("Pipeline stage 'Embedding' execution failed.", error=str(exc))
            raise ExecutionError(f"Embedding stage failed: {str(exc)}") from exc
        context.end_stage("embedding_generation")

        # 2. RUN VECTOR INDEX NEAREST NEIGHBORS SEARCH
        context.start_stage("vector_retrieval")
        try:
            target_k = top_k or self.search_engine.default_top_k
            # Retrieve target_k + 1 to account for potential query self-exclusion
            search_res = self.search_engine.search(emb_res.embedding_vector, k=target_k + 1)
        except Exception as exc:
            logger.error("Pipeline stage 'Vector Retrieval' execution failed.", error=str(exc))
            raise ExecutionError(f"Vector Retrieval stage failed: {str(exc)}") from exc
        context.end_stage("vector_retrieval")

        # 3. CANDIDATE LOOKUPS RESOLUTION & FILTER EXCLUSION
        context.start_stage("candidate_resolution")
        candidates = []
        
        # Exclude the query case itself by ID (Critical Fix #1)
        query_id = query_signature.case_master_id
        filtered_results = [r for r in search_res.results if r.case_id != query_id]
        
        # Limit to target_k matches after self-exclusion
        filtered_results = filtered_results[:target_k]
        
        logger.info(
            "Candidate search filtering applied.",
            query_id=query_id,
            retrieved_count=len(search_res.results),
            filtered_count=len(filtered_results),
        )

        for result in filtered_results:
            case_id = result.case_id
            
            # Resolve signature
            if isinstance(candidate_resolver, dict):
                sig = candidate_resolver.get(case_id)
            else:
                sig = candidate_resolver(case_id)

            if sig:
                candidates.append(sig)
            else:
                context.add_warning(
                    f"Failed to resolve candidate signature details for Case ID: {case_id}."
                )
        context.end_stage("candidate_resolution")

        # 4. RUN HYBRID SIMILARITY ENGINE RE-RANKING
        context.start_stage("similarity_scoring")
        try:
            # We pass the query vector to enable embedding similarity comparison
            re_ranked_results = self.similarity_engine.compute_similarity(
                query=query_signature,
                candidates=candidates,
                query_vector=emb_res.embedding_vector,
            )
        except Exception as exc:
            logger.error("Pipeline stage 'Similarity Scoring' execution failed.", error=str(exc))
            raise ExecutionError(f"Similarity Scoring stage failed: {str(exc)}") from exc
        context.end_stage("similarity_scoring")

        context.end_stage("total_pipeline")

        # Gather static metadata references
        embedding_meta = self.embedding_orchestrator.get_model_metadata(target_model)
        search_meta = {
            "index_type": self.search_engine.manager.index_type,
            "metric": self.search_engine.manager.metric,
            "index_size": self.search_engine.manager.size(),
            "retrieved_count": len(search_res.results),
            "filtered_count": len(filtered_results),
            "warnings": context.warnings,
        }

        logger.info(
            "End-to-end crime analysis pipeline execution complete.",
            total_duration_ms=context.timings.get("total_pipeline"),
            candidates_retrieved=len(search_res.results),
            candidates_filtered=len(filtered_results),
            candidates_ranked=len(re_ranked_results),
            warnings_count=len(context.warnings),
        )


        return PipelineResult(
            query_crime=query_signature,
            top_similar_crimes=re_ranked_results,
            processing_times_ms=context.timings,
            embedding_metadata=embedding_meta,
            search_metadata=search_meta,
        )
