import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.fir import FIRModel
from app.models.normalized import (
    District,
    PoliceStation,
    Employee,
    CrimeHead,
    CrimeSubHead,
    CaseMaster,
    ComplainantDetails,
    Victim,
    Accused,
    ChargesheetDetails,
)

def seed_database(db: Session):
    # Check if database already has legacy FIRs
    if db.query(FIRModel).first() is None:
        print("Legacy database empty. Seeding legacy database first...")
        _seed_legacy_data(db)
    else:
        print("Legacy FIRs exist. Skipping legacy seed...")
        
    # Migrate legacy data to normalized database structure
    migrate_existing_to_normalized(db)

def _seed_legacy_data(db: Session):
    # Set random seed for deterministic generation
    random.seed(42)

    categories = ["Theft", "Cyber Crime", "Assault", "Domestic Violence", "Drug Possession", "Fraud", "Other"]
    priorities = ["low", "medium", "high", "critical"]
    statuses = ["pending", "investigating", "solved", "closed"]
    
    officers = [
        "Insp. Vikram Singh",
        "SI Ananya Reddy",
        "Insp. Ramesh Patil",
        "W/Insp. Kavita Joshi",
        "Dy. SP Arjun Malhotra",
        "SI Deepak Gupta",
        "Insp. Suresh Nair",
        "Insp. Manoj Tiwari"
    ]

    stations = {
        "Koramangala PS": {"district": "Bengaluru City", "ward": "Ward 67", "lat": 12.9340, "lng": 77.6100},
        "Mysuru Central PS": {"district": "Mysuru City", "ward": "Ward 2", "lat": 12.3086, "lng": 76.6531},
        "Indiranagar PS": {"district": "Bengaluru City", "ward": "Ward 80", "lat": 12.9650, "lng": 77.6400},
        "Jayanagar PS": {"district": "Bengaluru City", "ward": "Ward 54", "lat": 12.9250, "lng": 77.5900},
        "EOW, Bengaluru": {"district": "Bengaluru City", "ward": "Ward 10", "lat": 12.9700, "lng": 77.5850},
        "Whitefield PS": {"district": "Bengaluru City", "ward": "Ward 45", "lat": 12.9698, "lng": 77.7500},
        "Cyber Cell, Bengaluru": {"district": "Bengaluru City", "ward": "Ward 12", "lat": 12.9716, "lng": 77.5946},
        "Narcotics Cell, Bengaluru": {"district": "Bengaluru City", "ward": "Ward 12", "lat": 12.9720, "lng": 77.5950},
        "Hubballi North PS": {"district": "Hubballi-Dharwad", "ward": "Ward 4", "lat": 15.3647, "lng": 75.1240},
        "Mangaluru East PS": {"district": "Mangaluru City", "ward": "Ward 1", "lat": 12.8706, "lng": 74.8430},
        "Belagavi Town PS": {"district": "Belagavi", "ward": "Ward 5", "lat": 15.8497, "lng": 74.4977},
    }

    complainants = [
        "Rajesh Kumar Sharma", "Priya Mehta", "Mohammed Asif Khan", "Sunita Devi", 
        "Tech Solutions Pvt. Ltd.", "Harpreet Singh Gill", "Amit Verma", "Neha Kapoor",
        "Ravi Kant", "Siddharth Sen", "Debashis Mukherjee", "Tania Banerjee", 
        "Arjun Das", "Sanjay Singhal", "Vikash Gupta", "Rohan Malik"
    ]

    offenses_by_category = {
        "Theft": ["Theft — Motor Vehicle", "Chain Snatching", "House Trespass and Theft", "Bicycle Theft", "Pickpocketing"],
        "Cyber Crime": ["Cyber Fraud — UPI Scam", "Phishing Attack", "Identity Theft", "Social Media Hacking", "Online Job Scam"],
        "Assault": ["Assault — Grievous Hurt", "Simple Hurt", "Public Affray", "Criminal Intimidation"],
        "Domestic Violence": ["Domestic Violence", "Cruelty by Husband/Relatives", "Marital Dispute Escalation"],
        "Drug Possession": ["Drug Possession — NDPS Act", "Illicit Drug Trafficking", "Possession of Contraband"],
        "Fraud": ["Cheating — Business Fraud", "Fake Document Forgery", "Land Scam", "Investment Fraud"],
        "Other": ["Missing Person Report", "Public Nuisance", "Destruction of Public Property", "Vandalism"]
    }

    records = []
    base_date = datetime.now() - timedelta(days=365)
    
    # 1. Seed specific pattern: Bike thefts near Mysuru Central (mainly in evenings)
    for i in range(18):
        date_offset = random.randint(30, 360)
        date = base_date + timedelta(days=date_offset)
        date = date.replace(hour=random.randint(17, 22), minute=random.randint(0, 59))
        lat = 12.3086 + random.uniform(-0.005, 0.005)
        lng = 76.6531 + random.uniform(-0.005, 0.005)
        
        records.append(FIRModel(
            fir_number=f"FIR/2026/A{1000 + i}",
            complainant=random.choice(complainants),
            offense="Bicycle Theft" if random.random() > 0.3 else "Theft — Motor Vehicle",
            station="Mysuru Central PS",
            officer=random.choice(officers),
            date=date,
            status=random.choice(statuses),
            priority=random.choice(["low", "medium", "high"]),
            latitude=lat,
            longitude=lng,
            district="Mysuru City",
            ward="Ward 2",
            crime_category="Theft",
            severity=random.choice(["low", "medium", "high"]),
            risk_score=random.randint(40, 75)
        ))

    # 2. Seed specific pattern: Cyber Fraud shifting towards Koramangala over last 60 days
    for i in range(20):
        date_offset = random.randint(305, 365)
        date = base_date + timedelta(days=date_offset)
        date = date.replace(hour=random.randint(9, 18), minute=random.randint(0, 59))
        lat = 12.9340 + random.uniform(-0.007, 0.007)
        lng = 77.6100 + random.uniform(-0.007, 0.007)

        records.append(FIRModel(
            fir_number=f"FIR/2026/C{1000 + i}",
            complainant=random.choice(complainants),
            offense=random.choice(offenses_by_category["Cyber Crime"]),
            station="Koramangala PS",
            officer="SI Ananya Reddy" if random.random() > 0.4 else random.choice(officers),
            date=date,
            status=random.choice(statuses),
            priority=random.choice(["medium", "high", "critical"]),
            latitude=lat,
            longitude=lng,
            district="Bengaluru City",
            ward="Ward 67",
            crime_category="Cyber Crime",
            severity=random.choice(["medium", "high", "critical"]),
            risk_score=random.randint(60, 95)
        ))

    # 3. Seed specific pattern: Domestic violence highest during weekends
    for i in range(12):
        date_offset = random.randint(10, 360)
        date = base_date + timedelta(days=date_offset)
        while date.weekday() not in [5, 6]:
            date += timedelta(days=1)
        date = date.replace(hour=random.randint(18, 23), minute=random.randint(0, 59))
        
        station_name = random.choice(["Jayanagar PS", "Indiranagar PS", "Whitefield PS", "Koramangala PS"])
        s_info = stations[station_name]
        lat = s_info["lat"] + random.uniform(-0.01, 0.01)
        lng = s_info["lng"] + random.uniform(-0.01, 0.01)

        records.append(FIRModel(
            fir_number=f"FIR/2026/D{1000 + i}",
            complainant=random.choice(complainants),
            offense="Domestic Violence",
            station=station_name,
            officer="W/Insp. Kavita Joshi" if random.random() > 0.3 else random.choice(officers),
            date=date,
            status=random.choice(statuses),
            priority=random.choice(["medium", "high"]),
            latitude=lat,
            longitude=lng,
            district=s_info["district"],
            ward=s_info["ward"],
            crime_category="Domestic Violence",
            severity=random.choice(["medium", "high"]),
            risk_score=random.randint(45, 80)
        ))

    # 4. Seed random miscellaneous crime incidents
    for i in range(35):
        date_offset = random.randint(10, 360)
        date = base_date + timedelta(days=date_offset)
        date = date.replace(hour=random.randint(0, 23), minute=random.randint(0, 59))
        
        category = random.choice(categories)
        station_name = random.choice(list(stations.keys()))
        s_info = stations[station_name]
        
        lat = s_info["lat"] + random.uniform(-0.012, 0.012)
        lng = s_info["lng"] + random.uniform(-0.012, 0.012)
        
        pri = random.choice(priorities)
        status = random.choice(statuses)

        records.append(FIRModel(
            fir_number=f"FIR/2026/{2000 + i}",
            complainant=random.choice(complainants),
            offense=random.choice(offenses_by_category[category]),
            station=station_name,
            officer=random.choice(officers),
            date=date,
            status=status,
            priority=pri,
            latitude=lat,
            longitude=lng,
            district=s_info["district"],
            ward=s_info["ward"],
            crime_category=category,
            severity=pri,
            risk_score=random.randint(15, 90)
        ))

    db.add_all(records)
    db.commit()
    print(f"Legacy database seeded with {len(records)} records.")

def migrate_existing_to_normalized(db: Session):
    """
    Auto-migration utility that copies flat data from the legacy 'firs' table
    into the normalized relational entities on startup, mapping all relations cleanly.
    """
    if db.query(CaseMaster).first() is not None:
        print("Normalized database tables already seeded/populated. Skipping migration...")
        return

    print("Executing auto-migration: Porting legacy FIRs to normalized tables...")
    
    legacy_firs = db.query(FIRModel).all()
    if not legacy_firs:
        print("No legacy FIRs available to migrate.")
        return

    # Registries to reuse generated entities
    districts = {}
    stations = {}
    employees = {}
    crime_heads = {}
    crime_sub_heads = {}

    station_meta = {
        "Koramangala PS": {"lat": 12.9340, "lng": 77.6100, "ward": "Ward 67"},
        "Mysuru Central PS": {"lat": 12.3086, "lng": 76.6531, "ward": "Ward 2"},
        "Indiranagar PS": {"lat": 12.9650, "lng": 77.6400, "ward": "Ward 80"},
        "Jayanagar PS": {"lat": 12.9250, "lng": 77.5900, "ward": "Ward 54"},
        "EOW, Bengaluru": {"lat": 12.9700, "lng": 77.5850, "ward": "Ward 10"},
        "Whitefield PS": {"lat": 12.9698, "lng": 77.7500, "ward": "Ward 45"},
        "Cyber Cell, Bengaluru": {"lat": 12.9716, "lng": 77.5946, "ward": "Ward 12"},
        "Narcotics Cell, Bengaluru": {"lat": 12.9720, "lng": 77.5950, "ward": "Ward 12"},
        "Hubballi North PS": {"lat": 15.3647, "lng": 75.1240, "ward": "Ward 4"},
        "Mangaluru East PS": {"lat": 12.8706, "lng": 74.8430, "ward": "Ward 1"},
        "Belagavi Town PS": {"lat": 15.8497, "lng": 74.4977, "ward": "Ward 5"},
    }

    # 1. District Registry
    for fir in legacy_firs:
        d_name = fir.district or "Bengaluru City"
        if d_name not in districts:
            district = db.query(District).filter(District.name == d_name).first()
            if not district:
                district = District(name=d_name, risk_score=50)
                db.add(district)
                db.commit()
                db.refresh(district)
            districts[d_name] = district

    # 2. PoliceStation Registry
    for fir in legacy_firs:
        s_name = fir.station or "Indiranagar PS"
        if s_name not in stations:
            station = db.query(PoliceStation).filter(PoliceStation.name == s_name).first()
            if not station:
                d_name = fir.district or "Bengaluru City"
                district = districts[d_name]
                meta = station_meta.get(s_name, {"lat": 12.9650, "lng": 77.6400, "ward": fir.ward or "Ward 80"})
                
                station = PoliceStation(
                    name=s_name,
                    district_id=district.id,
                    ward=meta.get("ward"),
                    base_latitude=meta.get("lat"),
                    base_longitude=meta.get("lng")
                )
                db.add(station)
                db.commit()
                db.refresh(station)
            stations[s_name] = station

    # 3. Employee Registry
    for fir in legacy_firs:
        o_name = fir.officer or "SI Ananya Reddy"
        if o_name not in employees:
            employee = db.query(Employee).filter(Employee.name == o_name).first()
            if not employee:
                s_name = fir.station or "Indiranagar PS"
                station = stations[s_name]
                badge = f"BADGE-{random.randint(1000, 9999)}"
                rank = "SI" if "SI" in o_name else "Insp." if "Insp" in o_name else "Dy. SP"
                
                employee = Employee(
                    name=o_name,
                    badge_number=badge,
                    rank=rank,
                    station_id=station.id,
                    status="on-duty"
                )
                db.add(employee)
                db.commit()
                db.refresh(employee)
            employees[o_name] = employee

    # 4. Crime Head & SubHead Registry
    for fir in legacy_firs:
        cat_name = fir.crime_category or "Other"
        if cat_name not in crime_heads:
            ch = db.query(CrimeHead).filter(CrimeHead.name == cat_name).first()
            if not ch:
                ch = CrimeHead(name=cat_name)
                db.add(ch)
                db.commit()
                db.refresh(ch)
            crime_heads[cat_name] = ch

        sub_name = fir.offense or "General Offense"
        sub_key = f"{cat_name}:{sub_name}"
        if sub_key not in crime_sub_heads:
            csh = db.query(CrimeSubHead).filter(
                CrimeSubHead.name == sub_name,
                CrimeSubHead.crime_head_id == crime_heads[cat_name].id
            ).first()
            if not csh:
                csh = CrimeSubHead(name=sub_name, crime_head_id=crime_heads[cat_name].id)
                db.add(csh)
                db.commit()
                db.refresh(csh)
            crime_sub_heads[sub_key] = csh

    # 5. Populate CaseMaster, ComplainantDetails, and Mock Records
    for fir in legacy_firs:
        case = db.query(CaseMaster).filter(CaseMaster.fir_number == fir.fir_number).first()
        if case:
            continue

        s_name = fir.station or "Indiranagar PS"
        o_name = fir.officer or "SI Ananya Reddy"
        cat_name = fir.crime_category or "Other"
        sub_name = fir.offense or "General Offense"
        sub_key = f"{cat_name}:{sub_name}"

        station = stations[s_name]
        officer = employees[o_name]
        subhead = crime_sub_heads[sub_key]

        case = CaseMaster(
            id=fir.id,
            fir_number=fir.fir_number,
            date=fir.date,
            status=fir.status,
            priority=fir.priority,
            severity=fir.severity or fir.priority,
            risk_score=fir.risk_score or 50,
            latitude=fir.latitude,
            longitude=fir.longitude,
            station_id=station.id,
            employee_id=officer.id,
            crime_sub_head_id=subhead.id,
            offense_description=fir.offense,
            incident_summary=f"FIR registered by {fir.complainant}. Detailed incident summary compiled.",
            evidence="Intake statement signed by complainant."
        )
        db.add(case)
        db.commit()
        db.refresh(case)

        # Complainant details
        complainant = ComplainantDetails(
            case_id=case.id,
            name=fir.complainant,
            phone=f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
            email=f"{fir.complainant.lower().replace(' ', '.')}@ksp.gov.in",
            address=f"Resident Area, {station.name} Jurisdiction",
            details="Incident reported in person."
        )
        db.add(complainant)

        # Seeding relational data for Solved / Closed cases
        if fir.status in ["solved", "closed"]:
            # Add victim
            victim = Victim(
                case_id=case.id,
                name=f"Victim — {fir.complainant}",
                age=random.randint(18, 65),
                gender=random.choice(["Male", "Female", "Other"]),
                contact="9876543210",
                details="Minor injuries treated."
            )
            db.add(victim)

            # Add Accused
            accused = Accused(
                case_id=case.id,
                name="Accused Rohan Gupta" if "Theft" in cat_name else "Accused Vikram Mallik",
                age=random.randint(20, 50),
                description="Height approx 5'9, dark jacket, identification confirmed.",
                details="Arrested near the station jurisdiction."
            )
            db.add(accused)

            # Add Chargesheet
            chargesheet = ChargesheetDetails(
                case_id=case.id,
                sections=f"IPC Section {random.choice([379, 420, 323, 498])}",
                date_filed=fir.date + timedelta(days=random.randint(7, 30)),
                status="filed",
                details="Investigation finalized. Evidence filed in Judicial Court."
            )
            db.add(chargesheet)

    db.commit()
    print(f"Relational auto-migration successfully completed. Populated {len(legacy_firs)} cases.")
