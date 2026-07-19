"""
CrimeLens AI — Pipeline Stage Interfaces

Defines the abstract interface for pipeline processing stages.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Union

if TYPE_CHECKING:
    from app.domain.models.signature import CrimeSignature
    from app.services.crime_signature.core.pipeline import PipelineContext


class PipelineStage(ABC):
    """
    Abstract interface for every feature engineering or validation stage
    in the Crime Signature Pipeline.
    
    Adheres to the Open-Closed Principle (OCP) and Dependency Inversion.
    """

    @abstractmethod
    def process(
        self,
        context: Union[PipelineContext, CrimeSignature],
    ) -> Union[PipelineContext, CrimeSignature]:
        """
        Executes business rules for this stage, transforming the immutable
        input context and returning the updated immutable context.

        Args:
            context: The current context of the pipeline (either PipelineContext
                     or final assembled CrimeSignature).

        Returns:
            The new transitioned state (either PipelineContext or CrimeSignature).
        """
        pass
