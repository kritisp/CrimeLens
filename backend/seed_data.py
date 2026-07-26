import requests
import time

API_URL = "https://crimelens-backend-50044197986.development.catalystappsail.in/api/v1/cases/"

SEED_FIRS = [
    {
        "case_master_id": 9001,
        "crime_no": "202610000000009001",
        "case_category": "FIR",
        "police_station_id": 14,
        "incident_date_from": "2026-10-01T22:30:00",
        "info_received_ps_date": "2026-10-02T08:00:00",
        "gravity_offence": "Heinous",
        "crime_major_head": "Theft",
        "crime_minor_head": "Motor Vehicle Theft",
        "statutory_charges": [{"act_code": "IPC", "section_code": "379"}],
        "latitude": 12.9716,
        "longitude": 77.5946,
        "brief_facts": "A black Hyundai Creta (KA-03-MB-4432) was reported stolen from MG Road parking. Witnesses reported a suspect named 'Raju' wearing a red hoodie using a digital key cloner.",
        "accused_list": [{"name": "Raju (Alias Rony)", "gender": "Male"}],
        "victims": [{"name": "Suresh H", "gender": "Male"}]
    },
    {
        "case_master_id": 9002,
        "crime_no": "202610000000009002",
        "case_category": "FIR",
        "police_station_id": 15,
        "incident_date_from": "2026-10-05T01:15:00",
        "info_received_ps_date": "2026-10-05T06:00:00",
        "gravity_offence": "Heinous",
        "crime_major_head": "Theft",
        "crime_minor_head": "Motor Vehicle Theft",
        "statutory_charges": [{"act_code": "IPC", "section_code": "379"}],
        "latitude": 12.9250,
        "longitude": 77.5800,
        "brief_facts": "Another Hyundai Creta (KA-05-AB-1234) stolen near Jayanagar. CCTV captured a man in a red hoodie matching the description of 'Raju'. He used an electronic relay attack.",
        "accused_list": [{"name": "Unknown Male in Red Hoodie", "gender": "Male"}],
        "victims": [{"name": "Priya K", "gender": "Female"}]
    },
    {
        "case_master_id": 9003,
        "crime_no": "202610000000009003",
        "case_category": "FIR",
        "police_station_id": 14,
        "incident_date_from": "2026-10-10T23:45:00",
        "info_received_ps_date": "2026-10-11T09:30:00",
        "gravity_offence": "Non-Heinous",
        "crime_major_head": "Fraud",
        "crime_minor_head": "Cyber Phishing",
        "statutory_charges": [{"act_code": "IT Act", "section_code": "66D"}],
        "latitude": 12.9710,
        "longitude": 77.5940,
        "brief_facts": "Victim received an OTP request regarding a Hyundai Creta insurance renewal. Bank account drained of Rs 50,000. Suspect called from number linked to 'Raju'.",
        "accused_list": [{"name": "Raju (Phone Owner)", "gender": "Male"}],
        "victims": [{"name": "Amit Sharma", "gender": "Male"}]
    },
    {
        "case_master_id": 9004,
        "crime_no": "202610000000009004",
        "case_category": "FIR",
        "police_station_id": 18,
        "incident_date_from": "2026-10-15T02:00:00",
        "info_received_ps_date": "2026-10-15T05:00:00",
        "gravity_offence": "Heinous",
        "crime_major_head": "Burglary",
        "crime_minor_head": "Commercial Break-in",
        "statutory_charges": [{"act_code": "IPC", "section_code": "457"}],
        "latitude": 13.0100,
        "longitude": 77.5500,
        "brief_facts": "A local electronics store in Malleshwaram was broken into. Screwdriver tool kit recovered. Suspect vehicle seen fleeing: Hyundai Creta.",
        "accused_list": [{"name": "Unidentified Masked Group", "gender": "Male"}],
        "victims": [{"name": "Rajesh Electronics", "gender": "Male"}]
    },
    {
        "case_master_id": 9005,
        "crime_no": "202610000000009005",
        "case_category": "FIR",
        "police_station_id": 14,
        "incident_date_from": "2026-10-20T21:00:00",
        "info_received_ps_date": "2026-10-21T07:00:00",
        "gravity_offence": "Heinous",
        "crime_major_head": "Assault",
        "crime_minor_head": "Grievous Hurt",
        "statutory_charges": [{"act_code": "IPC", "section_code": "326"}],
        "latitude": 12.9750,
        "longitude": 77.5900,
        "brief_facts": "Gang altercation outside a pub. A handgun was brandished by a suspect identified as 'Vikram' (alias Vicky). Suspect fled in a stolen Hyundai Creta.",
        "accused_list": [{"name": "Vikram (Alias Vicky)", "gender": "Male"}],
        "victims": [{"name": "Rahul Verma", "gender": "Male"}]
    }
]

def seed_database():
    print("Seeding database with highly interconnected FIRs...")
    for fir in SEED_FIRS:
        print(f"Ingesting {fir['crime_no']}...")
        response = requests.post(API_URL, json=fir)
        if response.status_code in [201, 200]:
            print(f"Success: {fir['crime_no']}")
        else:
            print(f"Failed {fir['crime_no']}: {response.text}")
        
        # Give the background task (Copilot Loop) a moment to trigger safely
        time.sleep(2)
        
    print("Seeding complete! The Network Explorer and AI Copilot now have deep correlations.")

if __name__ == "__main__":
    seed_database()
