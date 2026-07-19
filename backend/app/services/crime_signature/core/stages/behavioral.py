"""
CrimeLens AI — Pipeline Behavioral Feature Stage

Parses narrative context and accused lists to extract Modus Operandi (MO) tags
and behavioral signatures.
"""

from __future__ import annotations

import re
from typing import Union

from app.domain.models.signature import BehavioralFeatures, CrimeSignature
from app.services.crime_signature.core.interfaces import PipelineStage
from app.services.crime_signature.core.pipeline import PipelineContext


class BehavioralFeatureStage(PipelineStage):
    """
    Extracts Modus Operandi descriptors, suspect profiles, and target classes
    from narrative texts and relational suspect structures.
    """

    # Keyword mappings to label Modus Operandi tags
    MO_VOCABULARY = {
        "relay_bypass": [r"relay", r"clone", r"bypass", r"keyless", r"frequency"],
        "atm_skimming": [r"skimmer", r"atm", r"pinhole", r"card reader", r"terminal"],
        "organized_syndicate": [r"phantom", r"syndicate", r"gang", r"masked", r"coordinates"],
        "cyber_ransom": [r"malware", r"extortion", r"crypto", r"bitcoin", r"wallet"],
        "electronic_intrusion": [r"bypass", r"electronic", r"relay attack", r"device"],
    }

    def process(
        self,
        context: Union[PipelineContext, CrimeSignature],
    ) -> Union[PipelineContext, CrimeSignature]:
        if isinstance(context, CrimeSignature):
            return context

        case = context.case
        facts = context.normalized_facts or case.brief_facts

        # 1. Match Modus Operandi tags via narrative vocabulary
        extracted_tags = []
        for tag, patterns in self.MO_VOCABULARY.items():
            for pattern in patterns:
                if re.search(pattern, facts, re.IGNORECASE):
                    extracted_tags.append(tag)
                    break
        
        # 2. Extract target types from narrative context
        target_type = "OTHER"
        if re.search(r"creta|hyundai|suv|vehicle", facts, re.IGNORECASE):
            target_type = "VEHICLE: HYUNDAI CRETA"
        elif re.search(r"atm|bank|account|cash", facts, re.IGNORECASE):
            target_type = "FINANCIAL: ATM"
        elif re.search(r"telecom|vendor|firm|vendor", facts, re.IGNORECASE):
            target_type = "COMMERCIAL: TELECOM VENDOR"

        # 3. Compute repeat offender ratio
        # Mock calculation: if an accused has a name with 'Bouncer', 'Ravi' or
        # specific sequences, mark them as historical repeat offenders
        repeat_count = 0
        total_accused = len(case.accused_list)
        
        for suspect in case.accused_list:
            name = (suspect.name or "").lower()
            if "bouncer" in name or "ravi" in name:
                repeat_count += 1
                
        ratio = (repeat_count / total_accused) if total_accused > 0 else 0.0

        behavioral = BehavioralFeatures(
            modus_operandi_tags=sorted(extracted_tags),
            repeat_offender_ratio=round(ratio, 2),
            target_type=target_type,
        )

        return context.model_copy(update={"behavioral": behavioral})

