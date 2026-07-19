"""
CrimeLens AI — Crime Intelligence Engine

Orchestrator that wraps the Insight Generator, Recommendation Engine, and
Risk Analyzer to convert pipeline outputs into Intelligence JSON structures.
"""

from typing import List

from app.domain.models.signature import CrimeSignature
from app.services.crime_signature.similarity.models import SimilarityResult
from app.services.crime_intelligence.models import IntelligenceResult
from app.services.crime_intelligence.insight_generator import InsightGenerator
from app.services.crime_intelligence.recommendation_engine import RecommendationEngine
from app.services.crime_intelligence.risk_analyzer import RiskAnalyzer


class CrimeIntelligenceEngine:
    """
    Coordinates the generation of actionable intelligence from similarity results.
    """

    def __init__(self) -> None:
        self.insight_generator = InsightGenerator()
        self.recommendation_engine = RecommendationEngine()
        self.risk_analyzer = RiskAnalyzer()

    def generate_intelligence(
        self, query_crime: CrimeSignature, similar_crimes: List[SimilarityResult]
    ) -> IntelligenceResult:
        """
        Executes the deterministic intelligence generation pipeline.
        """
        # 1. Compute overall confidence mathematically (average of matches or max).
        # We'll use the maximum confidence observed as the defining weight, or 0.0.
        overall_confidence = max([sc.confidence for sc in similar_crimes], default=0.0)

        # 2. Extract Insights
        insights = self.insight_generator.generate_insights(query_crime, similar_crimes)

        # 3. Generate Recommendations
        recommendations = self.recommendation_engine.generate_recommendations(insights)

        # 4. Analyze Risk
        risk_level = self.risk_analyzer.analyze_risk(insights, overall_confidence)

        # 5. Extract raw patterns list
        patterns = [insight.category for insight in insights]

        return IntelligenceResult(
            risk_level=risk_level,
            insights=insights,
            recommendations=recommendations,
            patterns=patterns,
            confidence=round(overall_confidence, 3),
        )
