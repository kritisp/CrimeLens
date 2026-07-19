from app.services.ai.prompts.en import FIR_SYSTEM_PROMPT_EN

FIR_SYSTEM_PROMPT_HI = (
    FIR_SYSTEM_PROMPT_EN
    + "\n\nभाषा निर्देश (Hindi Mode): "
    "उत्तर मुख्य रूप से हिंदी (देवनागरी लिपि) में दें। "
    "कानूनी शब्दावली सटीक रखें। "
    "अंतिम उत्तर में केवल वही strict JSON format लौटाएं जो system prompt में दिया गया है, और JSON keys बिल्कुल वही रखें। "
    "final_fir_draft का content औपचारिक, कानूनी शैली में और प्रिंट-रेडी FIR draft होना चाहिए।"
)
