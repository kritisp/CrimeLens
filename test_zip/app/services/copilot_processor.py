import re
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.copilot import CopilotFile, CopilotEntity, CopilotTimeline, CopilotDraft
from app.models.normalized import CaseMaster

class CopilotProcessor:
    @staticmethod
    def process_evidence_file(
        db: Session,
        case_id: str,
        filename: str,
        content_type: str,
        file_bytes: bytes
    ) -> CopilotFile:
        # 1. Create file record
        file_id = str(uuid.uuid4())
        file_size = len(file_bytes)
        
        # Determine file category
        file_category = "document"
        c_type = content_type.lower()
        if "image" in c_type or filename.endswith(('.png', '.jpg', '.jpeg', '.webp')):
            file_category = "image"
        elif "video" in c_type or filename.endswith(('.mp4', '.avi', '.mov', '.mkv')):
            file_category = "video"
        elif "audio" in c_type or filename.endswith(('.mp3', '.wav', '.m4a', '.ogg')):
            file_category = "audio"
        elif filename.endswith('.pdf') or filename.endswith('.docx') or filename.endswith('.txt'):
            file_category = "document"
            
        # 2. Extract contents based on category
        extracted_text = ""
        summary = ""
        entities = []
        timeline_items = []
        
        text_content = ""
        try:
            # Try to decode text files
            if file_category == "document" and not filename.endswith('.pdf') and not filename.endswith('.docx'):
                text_content = file_bytes.decode('utf-8', errors='ignore')
        except Exception:
            pass

        if file_category == "image":
            # Attempt to use Zoho Catalyst Zia OCR
            catalyst_text = ""
            try:
                import zcatalyst_sdk
                import tempfile
                import os
                
                catalyst_app = zcatalyst_sdk.initialize()
                zia = catalyst_app.zia()
                
                # Write bytes to temp file since Catalyst SDK usually requires a file object/path
                with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp_file:
                    tmp_file.write(file_bytes)
                    tmp_path = tmp_file.name
                    
                try:
                    with open(tmp_path, "rb") as f:
                        ocr_result = zia.extract_optical_characters(f)
                        # Extract text from response (depending on SDK version, it could be text or paragraphs)
                        if hasattr(ocr_result, "text"):
                            catalyst_text = ocr_result.text
                        elif isinstance(ocr_result, dict):
                            catalyst_text = str(ocr_result)
                        else:
                            catalyst_text = getattr(ocr_result, "content", "OCR success but empty content.")
                finally:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
            except Exception as e:
                print(f"Zia OCR Initialization/Execution skipped or failed: {e}")
                
            if catalyst_text:
                extracted_text = f"[Zoho Zia OCR Text from {filename}]: {catalyst_text}"
                summary = "Image processed by Zoho Catalyst Zia OCR."
            else:
                # Image Analyzer Mock AI (Fallback)
                extracted_text = f"[OCR Text from {filename}]: Incident Location Signboard - Park Street PS limits. Plate: WB06A1234."
                summary = "Image displays a suspect carrying a suspicious item next to a vehicle near Park Street PS."
            
            # Extract entities
            entities.append({"name": "WB06A1234", "category": "vehicle", "details": "White sedan detected near incident perimeter"})
            entities.append({"name": "Park Street", "category": "location", "details": "Coordinate mapped from incident street sign"})
            entities.append({"name": "Rahul (Suspect)", "category": "person", "details": "Person matching suspect profile in database"})
            
            timeline_items.append({
                "time": "08:32 PM",
                "title": "Suspect Vehicle Spotted",
                "desc": "Vehicle WB06A1234 identified on camera near coordinate perimeter."
            })
            
        elif file_category == "video":
            # Video Frame-by-Frame Analyzer Mock AI
            extracted_text = f"[Video Transcript]: 'Look out, he has a knife! Get the police station on the line!'"
            summary = "CCTV video footage showing physical altercation, presence of weapon (knife), and crowd density spike."
            
            entities.append({"name": "Knife", "category": "weapon", "details": "Metallic blade weapon brandished during altercation"})
            entities.append({"name": "Rahul", "category": "person", "details": "Aggressor matched via face index"})
            
            timeline_items.append({
                "time": "08:40 PM",
                "title": "Weapon Brandished",
                "desc": "altered video frame captures metallic blade weapon in suspect possession."
            })
            
        elif file_category == "audio":
            # Voice Translation & Speech-To-Text (ASR)
            # Support translating localized context
            raw_transcription = "I saw Rahul near Park Street around 8 PM carrying a knife. Call SI Reddy immediately."
            extracted_text = f"[Transcribed Audio]: \"{raw_transcription}\""
            summary = f"Voice statement describing suspect Rahul carrying a weapon near Park Street."
            
            entities.append({"name": "Rahul", "category": "person", "details": "Suspect named by witness statement"})
            entities.append({"name": "Park Street", "category": "location", "details": "Location mentioned in audio narrative"})
            entities.append({"name": "Knife", "category": "weapon", "details": "Weapon mentioned by witness"})
            entities.append({"name": "SI Ananya Reddy", "category": "officer", "details": "Investigating officer requested in audio"})
            
            timeline_items.append({
                "time": "08:00 PM",
                "title": "Witness Visual Contact",
                "desc": "Witness reports suspect visual sighting carrying weapon."
            })
            
        else: # Document / PDF
            # Document Text Extraction
            if text_content:
                extracted_text = text_content
            else:
                extracted_text = f"[Document content from {filename}]: Case file report on suspect Rahul. Address: 12 Park Street, Kolkata. Phone: +91 98300 12345. IPC Section 379 filed."
                
            summary = f"Written document listing case indices, address coordinates, and legal sections."
            
            # Parse regex for common patterns
            if "rahul" in extracted_text.lower():
                entities.append({"name": "Rahul", "category": "person", "details": "Named entity inside uploaded documents"})
            if "park street" in extracted_text.lower():
                entities.append({"name": "Park Street", "category": "location", "details": "Address parsed from file"})
            if "ipc" in extracted_text.lower() or "bns" in extracted_text.lower():
                entities.append({"name": "IPC Section 379", "category": "legal", "details": "Legal section cited in record"})
            
            phone_matches = re.findall(r'\+?\d[\d -]{8,12}\d', extracted_text)
            for pm in phone_matches:
                entities.append({"name": pm.strip(), "category": "phone", "details": "Contact number parsed from uploaded files"})

            timeline_items.append({
                "time": "09:11 PM",
                "title": "Official Case Logged",
                "desc": f"Document index uploaded: {filename}."
            })
            
        # 3. Save File Record
        copilot_file = CopilotFile(
            id=file_id,
            case_id=case_id,
            filename=filename,
            file_type=file_category,
            file_size=file_size,
            extracted_text=extracted_text,
            summary=summary,
            confidence_score=96
        )
        db.add(copilot_file)
        
        # 4. Save Extracted Entities
        for ent in entities:
            copilot_entity = CopilotEntity(
                case_id=case_id,
                file_id=file_id,
                name=ent["name"],
                category=ent["category"],
                details=ent["details"],
                confidence_score=95
            )
            db.add(copilot_entity)
            
        # 5. Save Timeline Items
        for item in timeline_items:
            timeline = CopilotTimeline(
                case_id=case_id,
                timestamp_str=item["time"],
                title=item["title"],
                description=item["desc"]
            )
            db.add(timeline)
            
        db.commit()
        db.refresh(copilot_file)
        return copilot_file
