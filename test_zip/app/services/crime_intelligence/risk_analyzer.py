"""
CrimeLens AI — Risk Analyzer

Evaluates intelligence insights and confidence scores to assign
a definitive risk severity level.
"""

from typing import List

from app.services.crime_intelligence.models import Insight, RiskLevel


class RiskAnalyzer:
    """
    Computes case risk levels dynamically.
    """

    def analyze_risk(self, insights: List[Insight], overall_confidence: float) -> RiskLevel:
        """
        Determines the RiskLevel threshold.
        """
        insight_categories = {insight.category for insight in insights}

        # 1. CRITICAL
        # Very high confidence AND indicators of organized networks.
        if overall_confidence > 0.85 and "Potential Organized Crime Indicator" in insight_categories:
            return RiskLevel.CRITICAL

        # 2. HIGH
        # Moderate-high confidence with multiple behavioral/spatial correlations.
        high_risk_indicators = {"Similar Modus Operandi", "Spatial Pattern", "Temporal Pattern"}
        if overall_confidence > 0.70 and len(high_risk_indicators.intersection(insight_categories)) >= 2:
            return RiskLevel.HIGH

        if "Potential Organized Crime Indicator" in insight_categories:
            return RiskLevel.HIGH

        # 3. MEDIUM
        # Any structural similarities found but lower density.
        if insights and overall_confidence > 0.40:
            return RiskLevel.MEDIUM

        # 4. LOW
        # Default fallback
        return RiskLevel.LOW
