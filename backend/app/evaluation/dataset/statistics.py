"""
CrimeLens AI — Dataset Statistics

Computes statistical distributions and analytics over the loaded dataset.
"""

from typing import List, Dict, Any
from collections import Counter
from app.domain.models.ingested_case import IngestedCase

class DatasetStatistics:
    """Calculates dataset metrics."""

    def compute(self, dataset: List[IngestedCase]) -> Dict[str, Any]:
        stats: Dict[str, Any] = {
            "total_cases": len(dataset),
            "major_head_distribution": {},
            "police_station_distribution": {},
            "gravity_distribution": {},
            "missing_coordinates_count": 0,
        }

        if not dataset:
            return stats

        heads = Counter([case.crime_major_head for case in dataset])
        stations = Counter([case.police_station_id for case in dataset])
        gravity = Counter([case.gravity_offence for case in dataset])
        
        missing_coords = sum(1 for case in dataset if case.latitude is None or case.longitude is None)

        stats["major_head_distribution"] = dict(heads)
        stats["police_station_distribution"] = dict(stations)
        stats["gravity_distribution"] = dict(gravity)
        stats["missing_coordinates_count"] = missing_coords

        # Detect extreme class imbalance (e.g. if one crime head is > 80% of data)
        imbalances = {}
        for head, count in heads.items():
            ratio = count / len(dataset)
            if ratio > 0.8:
                imbalances[head] = f"Warning: Overrepresented ({ratio*100:.1f}%)"
            elif ratio < 0.01:
                imbalances[head] = f"Warning: Underrepresented ({ratio*100:.1f}%)"
                
        stats["class_imbalances"] = imbalances

        return stats
