"""
CrimeLens AI — Zoho Catalyst Repository (Supabase Alias)

Superseded by PostgresFIRRepository for Supabase PostgreSQL integration.
"""

from __future__ import annotations

from app.infrastructure.database.repositories.postgres_repository import PostgresFIRRepository

CatalystFIRRepository = PostgresFIRRepository
