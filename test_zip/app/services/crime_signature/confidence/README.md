# Confidence Estimation Engine

The Confidence Estimation Engine calculates the evidence density and population quality of match features between a query crime and a candidate match.

---

## 1. Architectural Layout

The diagram below details the structural layout of the Confidence Engine:

```
                    [ Similarity Match Scores ]
                                │
                                ▼
                      ┌──────────────────┐
                      │ ConfidenceEngine │ ◄── [ configs/confidence.yaml ]
                      └────────┬─────────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │ ConfidenceFactors  │ ──► (Map raw factor values)
                    └────────┬───────────┘
                               │
                               ▼
                   ┌──────────────────────┐
                   │ ConfidenceCalculator │ ──► (Run weighted sums)
                   └───────────┬──────────┘
                               │
                               ▼
                      [ ConfidenceResult ]
```

---

## 2. Design Decisions & Architectural Log

### A. Exclusions from Similarity score
The Similarity score computes structural/semantic alignment between two crimes. The Confidence score evaluates the quality of matched features. Calculating confidence using a separate weighted scheme provides analysts with insight into match credibility (e.g. high similarity but low confidence due to sparse behavioral profiles or missing spatial location points).

### B. Decoupled Weighting Configurations
Weights are mapped inside [confidence.yaml](file:///e:/desk/crimelens/backend/configs/confidence.yaml), summing up to 1.0. This allows adjusting confidence boundaries without modifying python calculation codes.

### C. Validation Protections
Values are clamped to the $[0.0, 1.0]$ boundary, protecting downstream algorithms from floating-point overflow.
