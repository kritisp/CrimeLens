"""
CrimeLens AI — Admin Setup Script

Creates the investigators table and seeds the default admin user.
Run this ONCE after deployment to set up initial credentials.

Usage:
    python create_admin.py
"""
import bcrypt
from app.db.session import get_sync_engine, get_sync_session_factory
from app.db.base import Base

# Must import all models so Base knows about them
import app.models.normalized
import app.models.copilot
import app.models.fir
import app.models.investigator
from app.models.investigator import Investigator


def init_db():
    engine = get_sync_engine()

    print("Creating tables if they don't exist...")
    Base.metadata.create_all(bind=engine)
    print("Tables confirmed.")

    factory = get_sync_session_factory()
    db = factory()
    try:
        email = "admin@ksp.gov.in"
        password = "admin123"

        existing = db.query(Investigator).filter(Investigator.email == email).first()
        if not existing:
            print(f"Creating admin user {email}...")
            hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            admin = Investigator(
                email=email,
                hashed_password=hashed,
                role="App Administrator",
                badge_id="KSP-ADMIN-01",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print(f"Admin user created. Badge ID: KSP-ADMIN-01")
        else:
            print(f"Admin user {email} already exists. Skipping.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
