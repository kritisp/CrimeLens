# CrimeLens AI — Crime Signature Engine v2

The **Crime Signature Engine v2** represents the foundational data structure redesign of the CrimeLens AI platform. It transitions the canonical `CrimeSignature` from a flat, partially structured model into an **immutable, deeply nested, cryptographic structure** derived directly from the Karnataka Police FIR Schema.

## Design Philosophy
1. **Immutability**: Once an `IngestedCase` is transformed into a `CrimeSignatureV2`, it is frozen. No downstream service can alter it.
2. **Decoupled Signatures**: The structure is divided into 12 logical sub-signatures (Taxonomy, Temporal, Spatial, Legal, Victim, Accused, Property, Behavioral, Investigation, Intelligence, Identity, and the Semantic Document).
3. **Traceability**: Every signature possesses a deterministic `signature_hash` computed over its unique identifiers and textual extraction.
4. **Semantic Embedding Target**: Instead of raw NLP parsing at the retrieval stage, the Builder explicitly constructs a human-readable `EmbeddingDocument` string incorporating the structured dimensions (Time, Space, Law, Taxonomy, MO) to optimize dense vector space indexing.

## UML Class Diagram

```mermaid
classDiagram
    class CrimeSignatureV2 {
        <<frozen>>
        +IdentitySignature identity
        +TaxonomySignature taxonomy
        +LegalSignature legal
        +TemporalSignature temporal
        +SpatialSignature spatial
        +VictimSignature victim
        +AccusedSignature accused
        +PropertySignature property
        +BehavioralSignature behavioral
        +InvestigationSignature investigation
        +IntelligenceSignature intelligence
        +EmbeddingDocument embedding_document
    }

    class IdentitySignature {
        +int case_master_id
        +str crime_no
        +str signature_hash
        +str schema_version
        +str feature_version
    }

    class TaxonomySignature {
        +str case_category
        +str gravity_offence
        +str crime_major_head
        +str crime_minor_head
    }

    class LegalSignature {
        +List~ActSection~ statutory_charges
    }

    class TemporalSignature {
        +str incident_date_from
        +str incident_date_to
        +str info_received_date
        +int reporting_delay_minutes
        +str day_of_week
        +str time_of_day
    }

    class SpatialSignature {
        +float latitude
        +float longitude
        +str geohash
        +int police_station_id
    }

    class EmbeddingDocument {
        +str semantic_text
    }

    CrimeSignatureV2 *-- IdentitySignature
    CrimeSignatureV2 *-- TaxonomySignature
    CrimeSignatureV2 *-- LegalSignature
    CrimeSignatureV2 *-- TemporalSignature
    CrimeSignatureV2 *-- SpatialSignature
    CrimeSignatureV2 *-- EmbeddingDocument
```
