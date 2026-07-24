"""
CrimeLens AI — Crime Signature Engine v2.1 Builders

Orchestrates the extraction, validation, hashing, and generation of the structured
nested signatures and CrimeDNA from a canonical IngestedCase payload.
"""

import hashlib
import json
from datetime import datetime

from app.domain.models.ingested_case import IngestedCase
from shared.geo.geohash import encode_geohash
from app.services.crime_signature_v2.models import (
    CrimeSignatureV2,
    IdentitySignature,
    TaxonomySignature,
    LegalSignature,
    ActSection,
    TemporalSignature,
    SpatialSignature,
    VictimSignature,
    AccusedSignature,
    PropertySignature,
    BehavioralSignature,
    InvestigationSignature,
    IntelligenceSignature,
    EmbeddingDocument,
    CrimeDNA,
    FeatureProvenance
)


def _hash_obj(data: str) -> str:
    """Helper to compute SHA-256 for sub-signatures."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


class EmbeddingDocumentBuilder:
    """Builds a sectioned structured textual representation for ML embedding."""
    
    @staticmethod
    def build(
        taxonomy: TaxonomySignature,
        legal: LegalSignature,
        temporal: TemporalSignature,
        spatial: SpatialSignature,
        victim: VictimSignature,
        accused: AccusedSignature,
        behavioral: BehavioralSignature,
        intelligence: IntelligenceSignature
    ) -> EmbeddingDocument:
        
        sections = []
        
        # 1. Crime Taxonomy
        sections.append(f"### Crime Taxonomy\nCategory: {taxonomy.case_category}. Gravity: {taxonomy.gravity_offence}. Major Head: {taxonomy.crime_major_head}. Minor Head: {taxonomy.crime_minor_head}.")

        # 2. Legal Signature
        charges = ", ".join([f"{ls.act_code} {ls.section_code}" for ls in legal.statutory_charges])
        sections.append(f"### Legal Signature\nStatutory Charges: {charges}.")

        # 3. Temporal Context
        sections.append(f"### Temporal Context\nDay of Week: {temporal.day_of_week}. Time of Day: {temporal.time_of_day}.")

        # 4. Behavioral Profile
        sections.append(f"### Behavior Profile\n{behavioral.behavior_summary}")

        # 5. Victim Profile
        sections.append(f"### Victim Profile\n{victim.victim_summary}")

        # 6. Accused Profile
        sections.append(f"### Accused Profile\n{accused.accused_summary}")

        # 7. Intelligence Indicators
        sections.append(f"### Crime Intelligence Indicators\n{intelligence.intelligence_summary}")

        semantic_text = "\n\n".join(sections)
        return EmbeddingDocument(semantic_text=semantic_text)


class SignatureBuilder:
    """Factory to construct an immutable CrimeSignatureV2 (Schema 2.1) from an IngestedCase."""

    FEATURE_VERSION = "2.1.0"

    def __init__(self) -> None:
        self.doc_builder = EmbeddingDocumentBuilder()

    def build_from_case(self, case: IngestedCase) -> CrimeSignatureV2:
        facts = case.brief_facts.lower()
        
        # 1. Taxonomy
        taxonomy_hash = _hash_obj(f"{case.case_category}|{case.gravity_offence}|{case.crime_major_head}|{case.crime_minor_head}")
        taxonomy = TaxonomySignature(
            case_category=case.case_category,
            gravity_offence=case.gravity_offence,
            crime_major_head=case.crime_major_head,
            crime_minor_head=case.crime_minor_head,
            taxonomy_hash=taxonomy_hash
        )

        # 2. Legal
        legal_str = "|".join([f"{ch.act_code}{ch.section_code}" for ch in case.statutory_charges])
        legal_hash = _hash_obj(legal_str)
        legal = LegalSignature(
            statutory_charges=[ActSection(act_code=ch.act_code, section_code=ch.section_code) for ch in case.statutory_charges],
            legal_hash=legal_hash
        )

        # 3. Temporal
        time_bracket = "Day Hours" if 6 <= case.incident_date_from.hour < 18 else "Night Hours"
        day_of_week = case.incident_date_from.strftime("%A")
        temporal_hash = _hash_obj(f"{time_bracket}|{day_of_week}")
        temporal = TemporalSignature(
            incident_date_from=case.incident_date_from.isoformat() + "Z",
            incident_date_to=case.incident_date_to.isoformat() + "Z" if case.incident_date_to else None,
            info_received_date=case.info_received_ps_date.isoformat() + "Z",
            reporting_delay_minutes=case.reporting_delay_minutes,
            day_of_week=day_of_week,
            time_of_day=time_bracket,
            temporal_hash=temporal_hash
        )

        # 4. Spatial
        geohash_str = encode_geohash(case.latitude, case.longitude, precision=6) if case.latitude and case.longitude else ""
        spatial_hash = _hash_obj(f"{case.police_station_id}|{geohash_str}")
        spatial = SpatialSignature(
            latitude=case.latitude,
            longitude=case.longitude,
            geohash=geohash_str or None,
            police_station_id=case.police_station_id,
            spatial_hash=spatial_hash
        )

        # 5. Victim (Mocking demographic distribution extraction)
        victim_count = len(case.victims)
        victim_cat = "Commercial" if "shop" in facts or "bank" in facts else "Individual"
        victim_summary = f"{victim_count} victim(s) identified. Category: {victim_cat}."
        victim_hash = _hash_obj(victim_summary)
        victim = VictimSignature(
            victim_count=victim_count,
            gender_distribution="Unknown",
            age_distribution="Unknown",
            occupation_distribution="Unknown",
            police_targeted=any(v.is_police for v in case.victims),
            victim_vulnerability_score=0.5,
            victim_category=victim_cat,
            victim_summary=victim_summary,
            victim_hash=victim_hash
        )

        # 6. Accused (Mocking intelligence extraction)
        acc_count = len(case.accused_list)
        gang_ind = "gang" in facts
        acc_summary = f"{acc_count} accused recorded. Gang involvement: {'Yes' if gang_ind else 'No'}."
        accused_hash = _hash_obj(acc_summary)
        accused = AccusedSignature(
            accused_count=acc_count,
            gender_distribution="Unknown",
            age_distribution="Unknown",
            known_gang_indicator=gang_ind,
            arrest_status="Unknown",
            accused_summary=acc_summary,
            accused_hash=accused_hash
        )

        # 7. Property
        property_sig = PropertySignature()

        # 8. Behavioral
        mo_tags = []
        weapon = None
        violence = False
        if "lock" in facts or "break" in facts or "forced" in facts:
            mo_tags.append("Forced Entry")
        if "knife" in facts or "rod" in facts or "gun" in facts:
            weapon = "Blunt/Edged Weapon"
            violence = True
            mo_tags.append("Armed Assault")
        
        behavior_summary = f"Tags: {', '.join(mo_tags)}. Weapon: {weapon or 'None'}."
        behavior_hash = _hash_obj(behavior_summary)
        
        prov_weapon = FeatureProvenance(
            field_name="weapon_used",
            source_column="brief_facts",
            transformation_rule="Regex Keyword Match",
            is_derived=True,
            confidence=0.85
        )

        behavioral = BehavioralSignature(
            entry_method="Forced" if "Forced Entry" in mo_tags else "Unknown",
            weapon_used=weapon,
            violence_used=violence,
            behavior_tags=mo_tags,
            behavior_summary=behavior_summary,
            behavior_hash=behavior_hash,
            provenance=[prov_weapon] if weapon else []
        )

        # 9. Investigation
        investigation = InvestigationSignature(case_status="OPEN")

        # 10. Intelligence
        org_ind = taxonomy.gravity_offence == "Heinous" and gang_ind
        night_ind = time_bracket == "Night Hours"
        intel_summary = f"Organized Crime: {org_ind}. Night Operation: {night_ind}."
        intel_hash = _hash_obj(intel_summary)

        intelligence = IntelligenceSignature(
            organized_crime_indicator=org_ind,
            night_crime_indicator=night_ind,
            intelligence_summary=intel_summary,
            intelligence_hash=intel_hash
        )

        # 11. DNA and Embedding Document
        overall_hash = _hash_obj(f"{behavior_hash}{legal_hash}{temporal_hash}{spatial_hash}{taxonomy_hash}{victim_hash}{accused_hash}")
        dna = CrimeDNA(
            behavior_hash=behavior_hash,
            legal_hash=legal_hash,
            temporal_hash=temporal_hash,
            spatial_hash=spatial_hash,
            taxonomy_hash=taxonomy_hash,
            victim_hash=victim_hash,
            accused_hash=accused_hash,
            overall_crime_hash=overall_hash
        )

        embedding_doc = self.doc_builder.build(
            taxonomy, legal, temporal, spatial, victim, accused, behavioral, intelligence
        )

        # 12. Identity
        identity = IdentitySignature(
            case_master_id=case.case_master_id,
            crime_no=case.crime_no,
            signature_hash=overall_hash,
            schema_version="2.1.0",
            feature_version=self.FEATURE_VERSION
        )

        return CrimeSignatureV2(
            identity=identity,
            crime_dna=dna,
            taxonomy=taxonomy,
            legal=legal,
            temporal=temporal,
            spatial=spatial,
            victim=victim,
            accused=accused,
            property=property_sig,
            behavioral=behavioral,
            investigation=investigation,
            intelligence=intelligence,
            embedding_document=embedding_doc
        )
