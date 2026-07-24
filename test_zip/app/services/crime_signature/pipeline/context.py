"""
CrimeLens AI — Pipeline Context

Tracks timing states, stages execution durations, and warning descriptors.
"""

from __future__ import annotations

import time
from typing import Dict, List


class PipelineContext:
    """
    Mutable context tracking timing states and logs metrics for a single
    execution run.
    """

    def __init__(self) -> None:
        self.timings: Dict[str, float] = {}
        self.warnings: List[str] = []
        self._start_times: Dict[str, float] = {}

    def start_stage(self, stage_name: str) -> None:
        """Starts timing diagnostic markers for a stage."""
        self._start_times[stage_name] = time.perf_counter()

    def end_stage(self, stage_name: str) -> None:
        """Stops timing diagnostic markers and records elapsed duration in ms."""
        if stage_name in self._start_times:
            elapsed = (time.perf_counter() - self._start_times[stage_name]) * 1000.0
            self.timings[stage_name] = round(elapsed, 3)

    def add_warning(self, message: str) -> None:
        """Appends a warning descriptor message to the tracking loop."""
        self.warnings.append(message)
