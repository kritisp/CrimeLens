"""
CrimeLens AI — API v1 Router

Central aggregator for all v1 API routes. This is the single file that
knows about every domain router. It mounts them under their respective
prefixes and assembles the complete v1 API surface.

Architectural role:
  - This file is the only place where route prefixes and tags are assigned.
  - Domain router files (cases.py, chat.py, etc.) know nothing about their
    own URL prefix — they only define paths relative to their mount point.
  - Adding a new domain means: (1) create the router file, (2) add one
    include_router() call here. Nothing else changes.

Versioning strategy:
  - This file is /api/v1/router.py. If a breaking API change is needed,
    /api/v2/router.py is created without modifying this file.
  - The app factory in main.py mounts both versions simultaneously,
    allowing old clients to continue working during their migration window.

Current routes registered:
  GET /api/v1/health    — System health probe (no auth)

Planned routes (uncomment as each domain task is completed):
  POST /api/v1/auth/login
  GET  /api/v1/cases
  GET  /api/v1/cases/{id}
  POST /api/v1/chat/query
  GET  /api/v1/heatmap/districts
  GET  /api/v1/heatmap/hotspots
  GET  /api/v1/network/nodes
  GET  /api/v1/network/links
  GET  /api/v1/reports/{type}
  GET  /api/v1/pattern/{id}
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import health

# The root v1 router — mounted at settings.api_v1_prefix in main.py
api_router = APIRouter()

# ── System ────────────────────────────────────────────────────────────────────
api_router.include_router(
    health.router,
    tags=["System"],
)

# ── Dashboard ─────────────────────────────────────────────────────────────────
from app.api.v1.endpoints import dashboard
api_router.include_router(
    dashboard.router,
    tags=["Dashboard"],
)

# ── Intelligence ──────────────────────────────────────────────────────────────
from app.api.v1.endpoints import intelligence
api_router.include_router(
    intelligence.router,
    tags=["Intelligence"],
)

# ── Analysis & Inference ─────────────────────────────────────────────────────
from app.api.v1.endpoints import analysis
api_router.include_router(
    analysis.router,
    prefix="/analysis",
    tags=["Analysis"],
)


# ── Authentication ─────────────────────────────────────────────────────────────
from app.api.v1.endpoints import auth
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# ── Cases ─────────────────────────────────────────────────────────────────────
from app.api.v1.endpoints import cases
api_router.include_router(cases.router, prefix="/cases", tags=["Cases"])

# ── Chat & Copilot ────────────────────────────────────────────────────────────
from app.api.v1.endpoints import chat
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])

# ── Heatmaps ──────────────────────────────────────────────────────────────────
from app.api.v1.endpoints import heatmap
api_router.include_router(heatmap.router, prefix="/heatmap", tags=["Heatmaps"])

# ── Network Explorer ──────────────────────────────────────────────────────────
from app.api.v1.endpoints import network
api_router.include_router(network.router, prefix="/network", tags=["Network"])

# ── Reports ───────────────────────────────────────────────────────────────────
from app.api.v1.endpoints import reports
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])

# ── Pattern Analysis ──────────────────────────────────────────────────────────
from app.api.v1.endpoints import patterns
api_router.include_router(patterns.router, prefix="/pattern", tags=["Patterns"])
