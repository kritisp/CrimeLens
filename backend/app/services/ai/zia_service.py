import os
import tempfile
import structlog
import zcatalyst_sdk
from typing import Optional, Dict, Any

logger = structlog.get_logger(__name__)

class ZiaService:
    def __init__(self):
        self._is_local = os.getenv("ENVIRONMENT", "development").lower() == "development"

    async def analyze_evidence(self, file_bytes: bytes, filename: str, request: Any = None) -> Dict[str, Any]:
        """
        Orchestrates Zia tools depending on file type.
        Returns a unified dictionary of extracted raw facts.
        """
        # Determine if it's an image or PDF based on extension
        is_image = any(filename.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png"])
        
        extracted_data = {
            "source": "Zia Fallback Mock",
            "ocr_text": "",
            "detected_objects": [],
            "faces": []
        }

        # If we are local, return mock data
        if self._is_local:
            return self._get_mock_zia_data(is_image)

        # Attempt actual SDK Calls using passed request headers
        try:
            # Initialize SDK with the request to extract headers
            cat_app = zcatalyst_sdk.initialize(req=request)
            zia = cat_app.zia()
            
            extracted_data["source"] = "Zia Production"
            
            # Write bytes to temp file safely
            fd, temp_path = tempfile.mkstemp()
            try:
                with os.fdopen(fd, "wb") as tmp:
                    tmp.write(file_bytes)
                
                # 1. Run OCR (works on both PDFs and Images)
                with open(temp_path, "rb") as f:
                    ocr_result = zia.extract_optical_characters(f, model_type="OCR")
                    if ocr_result and hasattr(ocr_result, "text"):
                        extracted_data["ocr_text"] = ocr_result.text

                # 2. If Image, run Object and Face detection
                if is_image:
                    with open(temp_path, "rb") as f:
                        obj_result = zia.detect_objects(f)
                        if obj_result and isinstance(obj_result, list):
                            extracted_data["detected_objects"] = [obj.name for obj in obj_result if hasattr(obj, "name")]

                    with open(temp_path, "rb") as f:
                        face_result = zia.analyze_face(f)
                        if face_result and isinstance(face_result, list):
                            extracted_data["faces"] = [
                                {
                                    "gender": f.gender if hasattr(f, "gender") else "Unknown",
                                    "age": f.age if hasattr(f, "age") else "Unknown"
                                } for f in face_result
                            ]
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            
        except Exception as e:
            logger.error(f"Zia SDK Execution Error: {e}. Falling back to mock data.")
            return self._get_mock_zia_data(is_image)

        return extracted_data

    def _get_mock_zia_data(self, is_image: bool) -> Dict[str, Any]:
        """Returns realistic mock data for Hackathon demo consistency."""
        if is_image:
            return {
                "source": "Zia Fallback Mock",
                "ocr_text": "KA-03-MB-4432",
                "detected_objects": ["Handgun", "Vehicle", "Backpack"],
                "faces": [{"gender": "Male", "age": "30-38"}]
            }
        else:
            return {
                "source": "Zia Fallback Mock",
                "ocr_text": "FIR REPORT\nIncident Date: 2026-10-24\nSuspect Rohan Gupta was seen fleeing the park perimeter toward Park Street Metro at 08:30 PM with a stolen backpack. Officer Vikram responded.",
                "detected_objects": [],
                "faces": []
            }

_zia_service: Optional[ZiaService] = None

def get_zia_service() -> ZiaService:
    global _zia_service
    if _zia_service is None:
        _zia_service = ZiaService()
    return _zia_service
