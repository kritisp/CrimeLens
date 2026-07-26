"""
CrimeLens AI — API Authentication Endpoints

Provides route handlers for:
  - POST /login   — Authenticate investigator credentials using Supabase/PostgreSQL.
  - POST /register — Register a new investigator (Super Admin only).
"""

from __future__ import annotations

import random
import string
from datetime import datetime, timedelta, timezone
import bcrypt
from fastapi import APIRouter, HTTPException, status, Depends, Request
from jose import jwt
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.investigator import Investigator

router = APIRouter()
settings = get_settings()


# ─── Helpers ────────────────────────────────────────────────────────────────

def _generate_badge_id() -> str:
    """Generate a unique badge ID in the format KSP-YYYY-XXXX."""
    year = datetime.now().year
    suffix = "".join(random.choices(string.digits, k=4))
    return f"KSP-{year}-{suffix}"


def _create_jwt(email: str, role: str, badge_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_access_token_expire_minutes
    )
    payload = {"sub": email, "role": role, "badge_id": badge_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


# ─── Schemas ────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str = Field(..., example="admin@ksp.gov.in")
    password: str = Field(..., example="admin123")
    role: str = Field(default="Investigator")


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    email: str
    role: str
    badge_id: str


class RegisterRequest(BaseModel):
    admin_secret: str = Field(..., description="Super Admin secret key")
    email: str = Field(..., example="officer.sharma@ksp.gov.in")
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., example="Inspector Sharma")
    role: str = Field(default="Investigator")


class RegisterResponse(BaseModel):
    message: str
    email: str
    badge_id: str
    role: str


# ─── Endpoints ──────────────────────────────────────────────────────────────

@router.get("/debug", status_code=200)
def debug_auth(request: Request, db: Session = Depends(get_db)):
    """Temporary debug endpoint — remove before final production."""
    try:
        sample = db.query(Investigator).filter(Investigator.email == "admin@ksp.gov.in").first()
        if not sample:
            return {"db_connected": True, "error": "admin user not found"}
        
        # Test 1: Verify Password
        verify_ok = False
        verify_error = None
        try:
            verify_ok = bcrypt.checkpw("admin123".encode("utf-8"), sample.hashed_password.encode("utf-8"))
        except Exception as ve:
            verify_error = str(ve)
            
        # Test 2: JWT encode
        # Test 2: JWT encode
        jwt_ok = False
        jwt_error = None
        try:
            token = _create_jwt(sample.email, sample.role, sample.badge_id)
            jwt_ok = True
        except Exception as je:
            jwt_error = str(je)

        # Test 3: Gemini API validation
        gemini_ok = False
        gemini_error = None
        try:
            from app.services.ai.gemini_service import get_gemini_service
            ai = get_gemini_service()
            if ai._client:
                # Try a tiny generation to verify API key & network
                response = ai._client.models.generate_content(
                    model=ai._model,
                    contents="respond with ok",
                )
                if response.text:
                    gemini_ok = True
            else:
                gemini_error = "Gemini client not initialized (GEMINI_API_KEY missing or invalid settings)"
        except Exception as ge:
            gemini_error = f"{type(ge).__name__}: {str(ge)}"

        # Test 4: Zoho Zia/Catalyst SDK validation
        zia_ok = False
        zia_error = None
        try:
            import zcatalyst_sdk
            cat_app = zcatalyst_sdk.initialize(req=request)
            cat_zia = cat_app.zia()
            zia_ok = True
        except Exception as ze:
            zia_error = f"{type(ze).__name__}: {str(ze)}"
            
        return {
            "db_connected": True,
            "sample_email": sample.email,
            "verify_ok": verify_ok,
            "verify_error": verify_error,
            "jwt_ok": jwt_ok,
            "jwt_error": jwt_error,
            "gemini_ok": gemini_ok,
            "gemini_error": gemini_error,
            "zia_ok": zia_ok,
            "zia_error": zia_error
        }
    except Exception as e:
        return {"db_connected": False, "error": str(e), "type": type(e).__name__}


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    """Authenticate an investigator against Supabase PostgreSQL."""
    user = db.query(Investigator).filter(Investigator.email == body.email).first()

    if not user or not bcrypt.checkpw(body.password.encode("utf-8"), user.hashed_password.encode("utf-8")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password credentials.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Contact your administrator.",
        )

    token = _create_jwt(user.email, user.role, user.badge_id)
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        email=user.email,
        role=user.role,
        badge_id=user.badge_id or "UNKNOWN",
    )


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register_investigator(
    body: RegisterRequest, db: Session = Depends(get_db)
) -> RegisterResponse:
    """
    Register a new investigator. ONLY accessible with a valid Super Admin secret key.
    """
    # 1. Validate super admin secret
    if body.admin_secret != settings.super_admin_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Super Admin credentials. Access denied.",
        )

    # 2. Check if investigator already exists
    existing = db.query(Investigator).filter(Investigator.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An investigator with email {body.email} already exists.",
        )

    # 3. Auto-generate a unique badge ID
    badge_id = _generate_badge_id()
    while db.query(Investigator).filter(Investigator.badge_id == badge_id).first():
        badge_id = _generate_badge_id()

    # 4. Hash the password and store
    hashed = bcrypt.hashpw(body.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    new_investigator = Investigator(
        email=body.email,
        hashed_password=hashed,
        role=body.role,
        badge_id=badge_id,
        is_active=True,
    )
    db.add(new_investigator)
    db.commit()

    return RegisterResponse(
        message=f"Investigator {body.full_name} registered successfully.",
        email=body.email,
        badge_id=badge_id,
        role=body.role,
    )
