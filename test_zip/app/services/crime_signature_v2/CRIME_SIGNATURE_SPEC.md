# Crime Signature Specification (v2.1)

This document provides the definitive specification for the `CrimeSignatureV2.1` schema. It serves as the official data contract for all downstream AI modules (Investigator Copilot, Crime Heatmaps, Network Explorer).

## 1. Top-Level Models

### 1.1 CrimeSignatureV2
The immutable root container for all sub-signatures representing a single FIR.
- **identity**: Core identifiers and schema version tracking.
- **crime_dna**: Cryptographic aggregation of all sub-signatures for O(1) matching and de-duplication.
- **taxonomy**: Categorical grouping (Major/Minor Head).
- **legal**: Statutory framework (IPC sections).
- **temporal**: Extracted and normalized time structures.
- **spatial**: Geolocation and jurisdictional bounding.
- **victim/accused**: Demographic and intelligence profiles.
- **behavioral**: Extracted Modus Operandi descriptors.
- **intelligence**: Derived ML indicators.
- **embedding_document**: Structured textual string strictly optimized for FAISS dense retrieval.

---

## 2. Granular Signatures & Hashes

### 2.1 CrimeDNA
**Purpose**: Enables Graph Construction and Pattern Detection without scanning textual features.
- **behavior_hash**: Identifies identical Modus Operandi execution.
- **spatial_hash**: Identifies identical Geohash / Police Station matches.
- **temporal_hash**: Identifies identical temporal cyclic patterns.
- **overall_crime_hash**: Deduplication key.

### 2.2 FeatureProvenance
**Purpose**: Explainability Engine dependency. Traces any derived indicator back to its source.
- **source_column**: e.g., `brief_facts`
- **transformation_rule**: e.g., `Regex Keyword Match` or `LLM Zero-Shot Classifier`
- **confidence**: Score from 0.0 to 1.0 indicating algorithmic certainty.

### 2.3 BehavioralSignature
**Purpose**: Deconstructs the narrative string into actionable behavioral traits.
- **entry_method / exit_method**: How the perimeter was breached. (e.g., "Broken Lock").
- **target_selection_strategy**: What the offender aimed for. (e.g., "Commercial Property").
- **weapon_used**: If armed, what type. (e.g., "Blunt/Edged Weapon").
- **planning_level**: (e.g., "Spontaneous", "Pre-planned").
- **Consumers**: Investigator Copilot, Pattern Detection Engine.

### 2.4 IntelligenceSignature
**Purpose**: Deterministic high-level flags indicating broader criminal phenomena.
- **organized_crime_indicator**: True if gravity is Heinous and Gang indicators exist.
- **night_crime_indicator**: True if time_of_day is "Night Hours".
- **Consumers**: Risk Engine, Crime Heatmaps.

---

## 3. Embedding Document Formatting
Unlike raw FIR text extraction, the v2.1 `EmbeddingDocumentBuilder` generates a highly structured format.

### Template Structure:
```text
### Crime Taxonomy
Category: {category}. Gravity: {gravity}. Major Head: {major}. Minor Head: {minor}.

### Legal Signature
Statutory Charges: {IPC Sections}

### Temporal Context
Day of Week: {day}. Time of Day: {time_bracket}.

### Behavior Profile
{behavior_summary}

### Victim Profile
{victim_summary}

### Accused Profile
{accused_summary}

### Crime Intelligence Indicators
{intelligence_summary}
```
**Why this format?**  
Dense retrieval embedding models (like all-MiniLM-L6-v2) perform significantly better when concepts are grouped logically and prefixed with strong semantic anchors (e.g., `### Behavior Profile`). It prevents the attention heads from confusing spatial tokens with behavioral tokens.
