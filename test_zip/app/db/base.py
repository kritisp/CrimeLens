from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# Import normalized models to register them on Base.metadata
# Avoid importing FIRModel here to prevent circular imports with fir.py
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
