"""
CrimeLens AI — API Authentication Endpoints

Provides route handlers for JWT login using Supabase/PostgreSQL native Auth.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, status, Depends
from jose import jwt
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext

from app.core.config import get_settings
from app.infrastructure.database.setup import get_db
from app.models.investigator import Investigator

router = APIRouter()
settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    email: str = Field(..., example="admin@ksp.gov.in")
    password: str = Field(..., example="admin123")
    role: str = Field(default="Investigator", example="Investigator")


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    email: str
    role: str
    badge_id: str


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> LoginResponse:
    """
    Authenticates investigator credentials using PostgreSQL DB (Supabase).
    """
    result = await db.execute(select(Investigator).where(Investigator.email == body.email))
    user = result.scalars().first()

    if not user or not pwd_context.verify(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password credentials."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended."
        )

    # Generate token payload
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    payload = {
        "sub": user.email,
        "role": user.role,
        "badge_id": user.badge_id,
        "exp": expire
    }
    
    # Encode JWT
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        email=user.email,
        role=user.role,
        badge_id=user.badge_id or "UNKNOWN"
    )
