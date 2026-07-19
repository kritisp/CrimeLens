"""
CrimeLens AI — Crime Intelligence Tests

Validates the deterministic rules mapping similarity vectors to intelligence insights.
"""

import pytest

from app.domain.models.signature import CrimeSignature, TextFeatures, SpatialFeatures, TemporalFeatures
from app.services.crime_signature.similarity.models import SimilarityResult, SimilarityExplanation
from app.services.crime_intelligence.engine import CrimeIntelligenceEngine
from app.services.crime_intelligence.models import RiskLevel


@pytest.fixture
def intelligence_engine() -> CrimeIntelligenceEngine:
    return CrimeIntelligenceEngine()


from unittest.mock import MagicMock

@pytest.fixture
def sample_query_signature() -> CrimeSignature:
    mock_sig = MagicMock(spec=CrimeSignature)
    mock_sig.case_master_id = 999
    return mock_sig


def create_mock_similarity(case_id: int, matched_features: list[str], confidence: float) -> SimilarityResult:
    return SimilarityResult(
        case_id=case_id,
        overall_similarity=0.8,
        comparator_scores={},
        matched_features=matched_features,
        confidence=confidence,
        explanation=SimilarityExplanation(rationale="Test", comparator_explanations={})
    )


def test_no_matches_yields_low_risk(
    intelligence_engine: CrimeIntelligenceEngine, sample_query_signature: CrimeSignature
):
    result = intelligence_engine.generate_intelligence(sample_query_signature, [])
    assert result.risk_level == RiskLevel.LOW
    assert len(result.insights) == 0
    assert len(result.recommendations) == 1
    assert result.recommendations[0].priority == "LOW"


def test_temporal_pattern_insight(
    intelligence_engine: CrimeIntelligenceEngine, sample_query_signature: CrimeSignature
):
    sims = [
        create_mock_similarity(1, ["TEMPORAL"], 0.5),
        create_mock_similarity(2, ["TEMPORAL"], 0.6),
        create_mock_similarity(3, ["OTHER"], 0.4),
    ]
    result = intelligence_engine.generate_intelligence(sample_query_signature, sims)
    
    assert "Temporal Pattern" in result.patterns
    assert any(rec.action.startswith("Verify CCTV") for rec in result.recommendations)
    assert result.risk_level == RiskLevel.MEDIUM


def test_organized_crime_critical_risk(
    intelligence_engine: CrimeIntelligenceEngine, sample_query_signature: CrimeSignature
):
    sims = [
        create_mock_similarity(1, ["CRIME_HEAD", "BEHAVIOR"], 0.9),
        create_mock_similarity(2, ["CRIME_HEAD", "BEHAVIOR"], 0.95),
    ]
    result = intelligence_engine.generate_intelligence(sample_query_signature, sims)
    
    assert "Potential Organized Crime Indicator" in result.patterns
    assert result.risk_level == RiskLevel.CRITICAL
    
    critical_recs = [rec for rec in result.recommendations if rec.priority == "CRITICAL"]
    assert len(critical_recs) > 0
