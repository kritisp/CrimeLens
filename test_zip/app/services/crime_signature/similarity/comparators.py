"""
CrimeLens AI — Similarity Comparators

Implements specific feature comparisons (Embedding, Crime Head, Crime Sub Head,
Temporal, Spatial, Legal, and Behavior).
"""

from __future__ import annotations

import math
from typing import List, Optional, Tuple

from app.domain.models.signature import CrimeSignature
from app.services.crime_signature.similarity.interfaces import SimilarityComparator


class EmbeddingComparator(SimilarityComparator):
    """
    Compares narrative contexts. Evaluates raw embedding vectors cosine
    similarities if present, or falls back to word Jaccard overlaps.
    """

    def __init__(
        self,
        query_vector: Optional[List[float]] = None,
        candidate_vector: Optional[List[float]] = None,
    ) -> None:
        self.query_vector = query_vector
        self.candidate_vector = candidate_vector

    def compare(self, query: CrimeSignature, candidate: CrimeSignature) -> Tuple[float, str]:
        if self.query_vector and self.candidate_vector:
            # Cosine similarity (dot product of L2 normalized vectors)
            q_arr = self.query_vector
            c_arr = self.candidate_vector
            
            if len(q_arr) == len(c_arr) and len(q_arr) > 0:
                dot_prod = sum(qi * ci for qi, ci in zip(q_arr, c_arr))
                # Normalization safety (vectors are L2 normalized, so dot_prod in [-1, 1])
                score = max(0.0, min(1.0, (dot_prod + 1.0) / 2.0))
                return score, f"Dense vector semantic cosine similarity score: {score:.3f}."

        # Fallback to Jaccard similarity on narrative summaries
        q_words = set(query.text.narrative_summary.lower().split())
        c_words = set(candidate.text.narrative_summary.lower().split())
        
        intersection = len(q_words.intersection(c_words))
        union = len(q_words.union(c_words))
        score = (intersection / union) if union > 0 else 0.0
        
        return score, f"Text narrative summary Jaccard overlap score: {score:.3f}."


class CrimeHeadComparator(SimilarityComparator):
    """Compares major crime classification heads."""

    def compare(self, query: CrimeSignature, candidate: CrimeSignature) -> Tuple[float, str]:
        q_head = query.structured.major_head.strip().upper()
        c_head = candidate.structured.major_head.strip().upper()

        if q_head == c_head:
            return 1.0, f"Major heads match exactly: '{q_head}'."
        return 0.0, f"Major heads do not match ('{q_head}' vs. '{c_head}')."


class CrimeSubHeadComparator(SimilarityComparator):
    """Compares minor crime classification heads."""

    def compare(self, query: CrimeSignature, candidate: CrimeSignature) -> Tuple[float, str]:
        q_sub = query.structured.minor_head.strip().upper()
        c_sub = candidate.structured.minor_head.strip().upper()

        if q_sub == c_sub:
            return 1.0, f"Minor heads match exactly: '{q_sub}'."
        return 0.0, f"Minor heads do not match ('{q_sub}' vs. '{c_sub}')."


class TemporalComparator(SimilarityComparator):
    """Compares cyclical trigonometric time offsets."""

    def compare(self, query: CrimeSignature, candidate: CrimeSignature) -> Tuple[float, str]:
        # 1. Hour Similarity (Cosine match mapped to [0.0, 1.0])
        q_h = query.temporal
        c_h = candidate.temporal
        
        # Normalize cyclical vectors to prevent precision rounding errors
        qh_norm = math.sqrt(q_h.hour_sin**2 + q_h.hour_cos**2)
        ch_norm = math.sqrt(c_h.hour_sin**2 + c_h.hour_cos**2)
        qh_sin = q_h.hour_sin / qh_norm if qh_norm > 0 else q_h.hour_sin
        qh_cos = q_h.hour_cos / qh_norm if qh_norm > 0 else q_h.hour_cos
        ch_sin = c_h.hour_sin / ch_norm if ch_norm > 0 else c_h.hour_sin
        ch_cos = c_h.hour_cos / ch_norm if ch_norm > 0 else c_h.hour_cos

        h_dot = (qh_sin * ch_sin) + (qh_cos * ch_cos)
        h_score = (h_dot + 1.0) / 2.0

        # 2. Day of Week Similarity
        qd_norm = math.sqrt(q_h.day_sin**2 + q_h.day_cos**2)
        cd_norm = math.sqrt(c_h.day_sin**2 + c_h.day_cos**2)
        qd_sin = q_h.day_sin / qd_norm if qd_norm > 0 else q_h.day_sin
        qd_cos = q_h.day_cos / qd_norm if qd_norm > 0 else q_h.day_cos
        cd_sin = c_h.day_sin / cd_norm if cd_norm > 0 else c_h.day_sin
        cd_cos = c_h.day_cos / cd_norm if cd_norm > 0 else c_h.day_cos

        d_dot = (qd_sin * cd_sin) + (qd_cos * cd_cos)
        d_score = (d_dot + 1.0) / 2.0

        # Weighted combination: 60% hour proximity, 40% weekday proximity
        score = (0.6 * h_score) + (0.4 * d_score)
        
        holiday_match = ""
        if q_h.is_holiday == c_h.is_holiday:
            holiday_match = " (Holiday profile matches)."

        return score, f"Trigonometric time offset overlap score: {score:.3f}{holiday_match}."



class SpatialComparator(SimilarityComparator):
    """Compares geohash prefix character string overlap lengths."""

    def compare(self, query: CrimeSignature, candidate: CrimeSignature) -> Tuple[float, str]:
        q_geo = query.spatial.geohash_code.strip()
        c_geo = candidate.spatial.geohash_code.strip()

        if q_geo == "UNKNOWN" or c_geo == "UNKNOWN":
            return 0.0, "Geographical coordinates unknown. Spatial comparison skipped."

        # Compute prefix character match length
        max_len = max(len(q_geo), len(c_geo))
        match_len = 0
        
        for q_char, c_char in zip(q_geo, c_geo):
            if q_char == c_char:
                match_len += 1
            else:
                break

        score = (match_len / max_len) if max_len > 0 else 0.0
        zone_info = ""
        
        if query.spatial.zone_classification == candidate.spatial.zone_classification:
            zone_info = f" Jurisdictional zone matched: '{query.spatial.zone_classification}'."

        return score, f"Spatial Geohash grid prefix overlap matches: {match_len} of {max_len}.{zone_info}"


class LegalComparator(SimilarityComparator):
    """Compares statutory Acts & Sections overlaps using Jaccard index."""

    def compare(self, query: CrimeSignature, candidate: CrimeSignature) -> Tuple[float, str]:
        q_laws = set(query.structured.statutory_charges)
        c_laws = set(candidate.structured.statutory_charges)

        if not q_laws or not c_laws:
            return 0.0, "No statutory charges registered for comparison."

        intersection = len(q_laws.intersection(c_laws))
        union = len(q_laws.union(c_laws))
        score = (intersection / union) if union > 0 else 0.0

        matched_charges = sorted(list(q_laws.intersection(c_laws)))
        match_desc = f", matched charges: {matched_charges}" if matched_charges else ""

        return score, f"Statutory laws Jaccard overlap index score: {score:.3f}{match_desc}."


class BehaviorComparator(SimilarityComparator):
    """Compares Modus Operandi keyword tags and target profiles."""

    def compare(self, query: CrimeSignature, candidate: CrimeSignature) -> Tuple[float, str]:
        # 1. MO tags Jaccard overlap
        q_mo = set(query.behavioral.modus_operandi_tags)
        c_mo = set(candidate.behavioral.modus_operandi_tags)

        mo_score = 0.0
        if q_mo or c_mo:
            intersection = len(q_mo.intersection(c_mo))
            union = len(q_mo.union(c_mo))
            mo_score = (intersection / union) if union > 0 else 0.0

        # 2. Target profiles matching
        target_score = 0.0
        q_target = query.behavioral.target_type.strip().upper()
        c_target = candidate.behavioral.target_type.strip().upper()
        if q_target == c_target:
            target_score = 1.0

        # Weighted combination: 70% MO overlap, 30% target matches
        score = (0.7 * mo_score) + (0.3 * target_score)

        mo_desc = f"Matched MO tags: {sorted(list(q_mo.intersection(c_mo)))}."
        target_desc = f" Target type matched: '{q_target}'." if target_score == 1.0 else ""

        return score, f"Behavioral MO similarity score: {score:.3f}. {mo_desc}{target_desc}"
