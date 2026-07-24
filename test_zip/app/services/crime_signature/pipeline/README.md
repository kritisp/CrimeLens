# Crime Analysis Pipeline Orchestrator

The integrated end-to-end **Crime Analysis Pipeline** coordinates the Pluggable Embedding Framework, Vector Retrieval Engine (FAISS), and Hybrid Similarity Engine into one executable ML query flow.

---

## 1. Architectural Diagram

The diagram below details the unified execution flow of the CrimeLens AI pipeline:

```
                      [ CrimeSignature ]
                              │
                              ▼
                 ┌──────────────────────────┐
                 │   CrimeAnalysisPipeline  │
                 └────────────┬─────────────┘
                              │
                              ▼
            (Stage 1) [ EmbeddingOrchestrator ] ──► (Generate dense coordinates)
                              │
                              ▼
            (Stage 2) [ SearchEngine (FAISS)  ] ──► (Retrieve Top-K Case IDs)
                              │
                              ▼
            (Stage 3) [ Candidate Lookup      ] ──► (Lookup case signature maps)
                              │
                              ▼
            (Stage 4) [ SimilarityEngine      ] ──► (Run weighted comparisons)
                              │
                              ▼
                      [ PipelineResult ]
```

---

## 2. Sequence Diagram

The step-by-step sequencing during a crime analysis query run:

```mermaid
sequenceDiagram
    autonumber
    participant Client as Application Layer
    participant Executor as PipelineExecutor
    participant Pipeline as CrimeAnalysisPipeline
    participant Context as PipelineContext
    participant Emb as EmbeddingOrchestrator
    participant Index as SearchEngine (FAISS)
    participant Sim as SimilarityEngine

    Client->>Executor: run(query_sig, candidate_resolver, model_name="minilm")
    activate Executor
    
    Executor->>Pipeline: analyze(query_sig, candidate_resolver, model_name)
    activate Pipeline
    
    Pipeline->>Context: start_stage("total_pipeline")
    
    Note over Pipeline,Emb: Stage 1: Embedding coordinates generation
    Pipeline->>Context: start_stage("embedding_generation")
    Pipeline->>Emb: get_embedding(query_sig, model_name)
    activate Emb
    Emb-->>Pipeline: EmbeddingResult (coordinates vector)
    deactivate Emb
    Pipeline->>Context: end_stage("embedding_generation")

    Note over Pipeline,Index: Stage 2: FAISS Nearest Neighbors search
    Pipeline->>Context: start_stage("vector_retrieval")
    Pipeline->>Index: search(query_vector, k=top_k)
    activate Index
    Index-->>Pipeline: SearchResponse (matched Case IDs)
    deactivate Index
    Pipeline->>Context: end_stage("vector_retrieval")

    Note over Pipeline: Stage 3: Candidate Lookup Resolution
    Pipeline->>Context: start_stage("candidate_resolution")
    loop For each matched ID
        Pipeline->>Pipeline: Lookup candidate CrimeSignature via resolver
    end
    Pipeline->>Context: end_stage("candidate_resolution")

    Note over Pipeline,Sim: Stage 4: Hybrid Similarity Scoring
    Pipeline->>Context: start_stage("similarity_scoring")
    Pipeline->>Sim: compute_similarity(query_sig, resolved_candidates, query_vector)
    activate Sim
    Sim-->>Pipeline: List[SimilarityResult] (Re-ranked matching list)
    deactivate Sim
    Pipeline->>Context: end_stage("similarity_scoring")

    Pipeline->>Context: end_stage("total_pipeline")
    
    Pipeline-->>Executor: PipelineResult
    deactivate Pipeline
    
    Executor-->>Client: PipelineResult
    deactivate Executor
```

---

## 3. Design Decisions & Architectural Log

### A. End-to-End Orchestration decoupling
To maintain clean borders, the pipeline orchestrator operates without direct connections to external database connections or web routers (like FastAPI). It is structured as a pure-python ML flow that consumes a query signature, an abstract search engine, and a callable resolver representing a database or caching layer, returning structured metrics.

### B. Timing Context Profiles (`PipelineContext`)
Diagnosing model execution lag requires granular monitoring metrics. The pipeline context runs timing markers (`time.perf_counter()`) for every stage (Embedding, Retrieval, Resolution, and Similarity), detailing millisecond lag attributes. These timing indicators are compiled directly inside the final query results payload.

### C. Resolution warning mappings
If the search index references Case IDs that are absent in database tables, the executor handles this without crashing, logs warnings (e.g. `"Failed to resolve candidate signature details..."`), and maps these warnings to the response metadata block.
