"""
CrimeLens AI — Recommendation Engine

Maps identified intelligence insights into deterministic, actionable
recommendations for investigators.
"""

from typing import List

from app.services.crime_intelligence.models import Insight, Recommendation


class RecommendationEngine:
    """
    Translates insights into concrete actions.
    """

    def generate_recommendations(self, insights: List[Insight]) -> List[Recommendation]:
        recommendations: List[Recommendation] = []
        
        insight_categories = {insight.category for insight in insights}

        if "Temporal Pattern" in insight_categories:
            recommendations.append(
                Recommendation(
                    action="Verify CCTV footage during matching time window.",
                    rationale="Multiple correlated cases share a cyclical time pattern, increasing the probability of capturing suspect transit.",
                    priority="HIGH"
                )
            )

        if "Similar Modus Operandi" in insight_categories:
            recommendations.append(
                Recommendation(
                    action="Compare vehicle registration records and entry tools.",
                    rationale="Identical behavioral execution suggests the same equipment or getaway vehicles are being used.",
                    priority="HIGH"
                )
            )

        if "Spatial Pattern" in insight_categories:
            recommendations.append(
                Recommendation(
                    action="Cross-check known offenders in the same police station.",
                    rationale="Geographical clustering often indicates local repeat offenders operating within their comfort zones.",
                    priority="MEDIUM"
                )
            )

        if "Similar Crime Head" in insight_categories or "Potential Organized Crime Indicator" in insight_categories:
            recommendations.append(
                Recommendation(
                    action="Review matching IPC sections for investigative consistency.",
                    rationale="Ensures statutory charges are uniformly applied across correlated syndicates.",
                    priority="MEDIUM"
                )
            )

        if "Potential Organized Crime Indicator" in insight_categories:
            recommendations.append(
                Recommendation(
                    action="Examine nearby FIRs within similar temporal windows.",
                    rationale="Organized networks often commit auxiliary offenses (e.g., vehicle theft followed by burglary).",
                    priority="CRITICAL"
                )
            )

        # Fallback if no specific insight triggers a recommendation
        if not recommendations:
            recommendations.append(
                Recommendation(
                    action="Manually review case dossiers.",
                    rationale="Algorithmic indicators are below thresholds, requiring human intuition.",
                    priority="LOW"
                )
            )

        # Sort by priority
        priority_weights = {"CRITICAL": 3, "HIGH": 2, "MEDIUM": 1, "LOW": 0}
        recommendations.sort(key=lambda r: priority_weights.get(r.priority, 0), reverse=True)

        return recommendations
