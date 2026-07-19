"""
CrimeLens AI — IR Metrics

Mathematical formulas for calculating Information Retrieval accuracy metrics.
"""

from typing import List
import math

class IRMetrics:
    
    @staticmethod
    def recall_at_k(retrieved_ids: List[int], relevant_ids: List[int], k: int) -> float:
        """Percentage of relevant items retrieved in top K."""
        if not relevant_ids:
            return 0.0
        retrieved_k = retrieved_ids[:k]
        hits = len(set(retrieved_k).intersection(set(relevant_ids)))
        return hits / len(relevant_ids)

    @staticmethod
    def precision_at_k(retrieved_ids: List[int], relevant_ids: List[int], k: int) -> float:
        """Percentage of top K retrieved items that are relevant."""
        if k == 0:
            return 0.0
        retrieved_k = retrieved_ids[:k]
        hits = len(set(retrieved_k).intersection(set(relevant_ids)))
        return hits / k

    @staticmethod
    def mean_reciprocal_rank(retrieved_ids: List[int], relevant_ids: List[int]) -> float:
        """MRR calculates 1/rank of the first relevant item."""
        for rank, item_id in enumerate(retrieved_ids, start=1):
            if item_id in relevant_ids:
                return 1.0 / rank
        return 0.0

    @staticmethod
    def average_precision(retrieved_ids: List[int], relevant_ids: List[int]) -> float:
        """Average Precision for a single query."""
        if not relevant_ids:
            return 0.0
        hits = 0
        sum_precisions = 0.0
        for rank, item_id in enumerate(retrieved_ids, start=1):
            if item_id in relevant_ids:
                hits += 1
                sum_precisions += hits / rank
        return sum_precisions / len(relevant_ids)

    @staticmethod
    def ndcg_at_k(retrieved_ids: List[int], relevant_ids: List[int], k: int) -> float:
        """Normalized Discounted Cumulative Gain at K."""
        retrieved_k = retrieved_ids[:k]
        
        # Calculate DCG
        dcg = 0.0
        for i, item_id in enumerate(retrieved_k):
            if item_id in relevant_ids:
                # Binary relevance = 1
                dcg += 1.0 / math.log2(i + 2)  # +2 because rank is 1-indexed and log2(1)=0
                
        # Calculate IDCG (Ideal DCG where all relevant items are at the top)
        idcg = 0.0
        ideal_hits = min(len(relevant_ids), k)
        for i in range(ideal_hits):
            idcg += 1.0 / math.log2(i + 2)
            
        if idcg == 0.0:
            return 0.0
            
        return dcg / idcg
