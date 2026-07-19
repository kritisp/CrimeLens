"""
CrimeLens AI — API Authentication Endpoints

Provides route handlers for JWT login and profile queries.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, status, Depends
from jose import jwt
from pydantic import BaseModel, Field

from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


class LoginRequest(BaseModel):
    username: str = Field(..., example="admin")
    password: str = Field(..., example="admin123")
    role: str = Field(default="Investigator", example="Investigator")


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str
    badge_id: str


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(body: LoginRequest) -> LoginResponse:
    """
    Authenticates investigator credentials and returns a signed JWT token.
    """
    # Standard KSP Demo credentials check
    if body.username == "admin" and body.password == "admin123":
        # Generate token payload
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
        payload = {
            "sub": body.username,
            "role": body.role,
            "badge_id": "KSP-2026-9041",
            "exp": expire
        }
        
        # Encode JWT
        token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
        
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            username=body.username,
            role=body.role,
            badge_id="KSP-2026-9041"
        )
        
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password credentials."
    )
