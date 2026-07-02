# CrimeLens AI — Backend Foundation

This directory houses the FastAPI Python service providing intelligent crime analytics, similarity search capabilities, and administrative management functions for the CrimeLens AI platform.

## Architecture

This project is built using **Clean Architecture** and **Domain-Driven Design (DDD)** concepts, ensuring strict isolation between business rules and technical mechanisms:

```
                  ┌─────────────────────────────────────┐
                  │                 API                 │  (FastAPI route layers,
                  │  (app/api)                          │   request/response validation)
                  └──────────────────┬──────────────────┘
                                     │ calls
                  ┌──────────────────▼──────────────────┐
                  │               Services              │  (Orchestration &
                  │  (app/services)                     │   application use-cases)
                  └──────────────────┬──────────────────┘
                                     │ uses
                  ┌──────────────────▼──────────────────┐
                  │             Domain Rules            │  (Core entities & abstract
                  │  (app/domain)                       │   repository interfaces)
                  └──────────────────▲──────────────────┘
                                     │ implements (dependency inversion)
                  ┌──────────────────┴──────────────────┐
                  │            Infrastructure           │  (DB, ML Models, File IO,
                  │  (app/infrastructure)               │   external web services)
                  └─────────────────────────────────────┘
```

- **Domain**: Stays entirely clean of databases, ORM models, FastAPI dependencies, or HTTP libraries.
- **Dependency Inversion**: Services depend on abstract interfaces (defined in `domain/interfaces/`). The implementation details (defined in `infrastructure/`) are injected via FastAPI dependencies. Swapping drivers (e.g. Memory DB → PostgreSQL) touches zero core business logic.

---

## Quick Start

### 1. Requirements

- Python 3.12 (Pinnend in `.python-version`)
- Python virtual environment manager (e.g. `venv`, `pyenv`, `conda`)

### 2. Environment Setup

```bash
# Generate virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Mac/Linux)
source .venv/bin/activate

# Install development dependencies
pip install -r requirements-dev.txt

# Create local environmental configuration
copy .env.example .env
```

### 3. Running Locally

Start the uvicorn development server:

```bash
# Run from backend/ folder
uvicorn app.main:app --reload --port 8000
```

- API Docs: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- Health Probe: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### 4. Running Verification Tools

```bash
# Format check
black --check .

# Lint audit
ruff check .

# Execute test suite
pytest
```
