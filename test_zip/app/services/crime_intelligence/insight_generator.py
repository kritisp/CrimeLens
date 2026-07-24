"""
CrimeLens AI — Insight Generator

Rule-based extraction of deterministic investigative insights from
similarity results.
"""

from typing import List, Set

from app.domain.models.signature import CrimeSignature
from app.services.crime_signature.similarity.models import SimilarityResult
from app.services.crime_intelligence.models import Insight


class InsightGenerator:
    """
    Extracts patterns by aggregating matching features across all similarity results.
    """

    def generate_insights(
        self, query_crime: CrimeSignature, similar_crimes: List[SimilarityResult]
    ) -> List[Insight]:
        """
        Determines insights based on frequency and types of matched features.
        """
        insights: List[Insight] = []
        if not similar_crimes:
            return insights

        # Aggregate all matched features across all similar cases
        feature_frequency = {}
        case_mapping = {}

        for sc in similar_crimes:
            for feat in sc.matched_features:
                if feat not in feature_frequency:
                    feature_frequency[feat] = 0
                    case_mapping[feat] = []
                feature_frequency[feat] += 1
                case_mapping[feat].append(f"FIR-{sc.case_id}")

        total_cases = len(similar_crimes)
        majority_threshold = max(1, total_cases // 2)

        # 1. Modus Operandi Pattern
        if "BEHAVIOR" in feature_frequency and feature_frequency["BEHAVIOR"] >= majority_threshold:
            insights.append(
                Insight(
                    category="Similar Modus Operandi",
                    description="Multiple cases exhibit identical behavioral traits and target selection methods.",
                    supporting_evidence=case_mapping["BEHAVIOR"]
                )
            )

        # 2. Temporal Pattern
        if "TEMPORAL" in feature_frequency and feature_frequency["TEMPORAL"] >= majority_threshold:
            insights.append(
                Insight(
                    category="Temporal Pattern",
                    description="Clustered incidents occurring within similar cyclical time windows.",
                    supporting_evidence=case_mapping["TEMPORAL"]
                )
            )

        # 3. Spatial Pattern
        if "SPATIAL" in feature_frequency and feature_frequency["SPATIAL"] >= majority_threshold:
            insights.append(
                Insight(
                    category="Spatial Pattern",
                    description="Geographical clustering of crimes within identical or adjacent Geohash zones.",
                    supporting_evidence=case_mapping["SPATIAL"]
                )
            )

        # 4. Organized Crime Indicator
        # Deterministic rule: If Crime Head matches AND Behavior matches across multiple cases.
        if (
            feature_frequency.get("CRIME_HEAD", 0) >= majority_threshold
            and feature_frequency.get("BEHAVIOR", 0) >= majority_threshold
        ):
            insights.append(
                Insight(
                    category="Potential Organized Crime Indicator",
                    description="High correlation of strict crime categories with repeated identical behavioral execution suggests an organized network.",
                    supporting_evidence=list(set(case_mapping.get("CRIME_HEAD", [])).intersection(case_mapping.get("BEHAVIOR", [])))
                )
            )

        # 5. Legal / Crime Head Pattern
        if "CRIME_HEAD" in feature_frequency and feature_frequency["CRIME_HEAD"] >= majority_threshold:
            insights.append(
                Insight(
                    category="Similar Crime Head",
                    description="Consistent major incident categorizations across correlated records.",
                    supporting_evidence=case_mapping["CRIME_HEAD"]
                )
            )

        return insights
