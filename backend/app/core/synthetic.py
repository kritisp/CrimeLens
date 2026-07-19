"""
CrimeLens AI — Synthetic Case Dataset Generator

Generates realistic mock dataset templates representing Karnataka Police FIRs.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta
from app.domain.models.ingested_case import Accused, ActSection, Complainant, IngestedCase, Victim


def generate_synthetic_dataset() -> list[IngestedCase]:
    """Generates 25 highly realistic, unique synthetic FIR cases within Karnataka boundaries."""
    cases = []
    
    # Core templates
    templates = [
        {
            "major": "Crimes Against Property", "minor": "Vehicle Theft", "gravity": "Heinous",
            "acts": [("IPC", "379"), ("IPC", "34")],
            "facts": "A two-wheeler, Royal Enfield Bullet, black in color, was stolen from outside the owner's residence during night hours by breaking the handle lock.",
            "zone": "URBAN RESIDENTIAL",
        },
        {
            "major": "Crimes Against Property", "minor": "House Breaking By Day", "gravity": "Heinous",
            "acts": [("IPC", "454"), ("IPC", "380")],
            "facts": "Unknown suspects entered a locked house during daytime by breaking the lock of the main gate, and stole gold ornaments and cash stored in the cupboard.",
            "zone": "URBAN METROPOLITAN",
        },
        {
            "major": "Cyber Crimes", "minor": "Online Bank Fraud", "gravity": "Non-Heinous",
            "acts": [("IT Act", "66D"), ("IPC", "420")],
            "facts": "The victim was cheated of Rs 75,000 by an unknown caller posing as a bank executive, who induced them to share credit card details and OTP coordinates.",
            "zone": "COMMERCIAL ZONE",
        },
        {
            "major": "Crimes Against Person", "minor": "Simple Hurt", "gravity": "Non-Heinous",
            "acts": [("IPC", "323"), ("IPC", "504")],
            "facts": "A physical fight occurred between neighbors over a minor water pipeline leakage dispute. The accused verbally abused and assaulted the complainant.",
            "zone": "RURAL ZONE",
        },
        {
            "major": "Crimes Against Property", "minor": "Dacoity", "gravity": "Heinous",
            "acts": [("IPC", "395"), ("IPC", "397")],
            "facts": "A gang of 5 masked suspects intercepted a logistics truck carrying electronic items on the highway, threatened the driver with weapons, and fled with the cargo.",
            "zone": "HIGHWAY HYBRID",
        }
    ]

    random.seed(42)
    start_date = datetime(2026, 6, 1)

    accused_names = [
        "Ravi 'Bouncer' Kumar", "Sunil Gowda", "Karan Bahadur", "Mohammed Ali", "Prashanth Nair",
        "Raghu Yadav", "Ananth Prasad", "Chethan Kumar", "Santhosh M.", "Abhishek Gowda",
        "Vijay Naik", "Nandisha K.", "Manjunath S.", "Srinivas CR", "Nagaraj Rao",
        "Harish Gowda", "Praveen Kumar", "Ramesh K.", "Vikas Yadav", "Shekhar Gowda",
        "Darshan S.", "Puneeth Raj", "Yashwanth M.", "Kiran Naik", "Ganesh Shetty"
    ]
    complainant_names = [
        "Suresh Kumar", "Ramesh Rao", "Anuradha N.", "Karthik R.", "Deepak Shenoy",
        "Savitha Naik", "Mahesh B.", "Shiva Gowda", "Divya Shetty", "Rajeshwari S.",
        "Vinay Kumar", "Sanjay J.", "Preeti S.", "Rahul Hegde", "Sumitra M.",
        "Lokesh CR", "Arun Patil", "Geeta Rao", "Nitin Naik", "Shweta G.",
        "Rakesh CR", "Vidya K.", "Vikram Rao", "Madhav Shenoy", "Sushma B."
    ]
    victim_names = [
        "Suresh Kumar", "Devendra K.", "Jyothi Prasad", "Naveen Raj", "Pooja Hegde",
        "Sujatha S.", "Anil Kumar", "Balaji N.", "Kavitha R.", "Vignesh S.",
        "Varun G.", "Sneha M.", "Mohan CR", "Mamatha Naik", "Raghavendra B.",
        "Shankar Patil", "Shruthi K.", "Sudarshan S.", "Gayathri R.", "Kishore Gowda",
        "Archana S.", "Girish Hegde", "Swathi M.", "Manish Rao", "Deepika S."
    ]

    for i in range(25):
        case_id = 1000 + i
        district_id = 1000 + (i % 5)
        ps_id = 400 + (i % 3)
        crime_no = f"1{district_id}{ps_id:04d}2026{i:05d}"

        # Choose a template
        template = templates[i % len(templates)]
        
        # Vary dates
        inc_days = i * 2
        inc_from = start_date + timedelta(days=inc_days, hours=i % 24)
        info_rec = inc_from + timedelta(hours=(i % 5) + 1)

        # Vary locations inside Karnataka State boundaries (approx 11.5N to 18.5N, 74.0E to 78.5E)
        lat = 12.97 + (i * 0.05)
        lon = 77.59 + (i * 0.02)
        
        # Format statutory charges
        charges = [ActSection(act_code=act, section_code=sec) for act, sec in template["acts"]]

        # Assemble Case
        cases.append(
            IngestedCase(
                case_master_id=case_id,
                crime_no=crime_no,
                case_category="FIR",
                gravity_offence=template["gravity"],
                crime_major_head=template["major"],
                crime_minor_head=template["minor"],
                police_station_id=ps_id,
                incident_date_from=inc_from,
                incident_date_to=inc_from + timedelta(minutes=30),
                info_received_ps_date=info_rec,
                latitude=round(lat, 4),
                longitude=round(lon, 4),
                brief_facts=f"FIR serial {crime_no}: {template['facts']}",
                complainant=Complainant(name=complainant_names[i % len(complainant_names)], age=25 + i, gender_id=1, occupation="Business"),
                victims=[Victim(name=victim_names[i % len(victim_names)], age=30 + i, gender_id=1, is_police=False)],
                accused_list=[Accused(name=accused_names[i % len(accused_names)], age=22 + i, gender_id=1, person_sequence="A1")],
                statutory_charges=charges,
            )
        )

    return cases
