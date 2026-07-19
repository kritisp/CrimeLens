"""
CrimeLens AI — Pipeline Exception Definitions

Defines custom exceptions thrown during pipeline staging or assembly.
"""

from __future__ import annotations

from app.core.exceptions import CrimeLensException


class PipelineError(CrimeLensException):
    """
    Raised when the pipeline fails to execute, when stages violate contracts,
    or when a validation stage catches unrecoverable data anomalies.
    """

    status_code = 422
    default_message = "Crime Signature Pipeline execution failed."


class PipelineValidationError(PipelineError):
    """
    Raised specifically by the ValidationStage when an input IngestedCase
    fails data integrity assertions needed to construct features.
    """

    status_code = 400
    default_message = "Pipeline validation checks failed for the target case."


class PipelineAssemblyError(PipelineError):
    """
    Raised when the Assembler fails to construct a complete signature
    due to missing or corrupted state data from upstream stages.
    """

    status_code = 422
    default_message = "Pipeline failed to assemble the canonical CrimeSignature."
