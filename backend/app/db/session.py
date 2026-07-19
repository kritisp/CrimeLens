import logging
from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.database_url
if db_url.startswith("sqlite+aiosqlite://"):
    db_url = db_url.replace("sqlite+aiosqlite://", "sqlite://")

engine_args = {}

# Resilient connection check
try:
    if "postgresql" in db_url or "postgres" in db_url:
        logger.info(f"Attempting connection to PostgreSQL database at {db_url}...")
        # Add connect_timeout to fail fast if port is closed or host is unreachable
        test_engine = create_engine(
            db_url, 
            pool_pre_ping=True, 
            connect_args={"connect_timeout": 2}
        )
        # Test connection quickly
        with test_engine.connect() as conn:
            pass
        engine = test_engine
        logger.info("Connected to PostgreSQL successfully.")
    else:
        if db_url.startswith("sqlite://"):
            engine_args = {"connect_args": {"check_same_thread": False}}
            engine = create_engine(db_url, pool_pre_ping=True, **engine_args)
        else:
            engine = create_engine(db_url, pool_pre_ping=True)
except Exception as exc:
    logger.warning(
        f"PostgreSQL connection failed: {exc}. "
        "Falling back to local SQLite database: sqlite:///./police_fir_db.db"
    )
    db_url = "sqlite:///./police_fir_db.db"
    engine_args = {"connect_args": {"check_same_thread": False}}
    engine = create_engine(db_url, **engine_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
