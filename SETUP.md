# 🛠️ CrimeLens AI — Setup & Execution Guide

This document provides step-by-step instructions to configure, run, and deploy the **CrimeLens AI** application locally, via Docker, and to Zoho Catalyst AppSail.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
*   [Python 3.12+](https://www.python.org/downloads/)
*   [Node.js 20+](https://nodejs.org/)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (optional, for containerized run)
*   A [Supabase](https://supabase.com/) PostgreSQL database instance
*   A [Google AI Studio Gemini API Key](https://aistudio.google.com/)

---

## 1. 🐍 Backend Setup (FastAPI)

The backend is built using FastAPI and Python 3.12.

### Step 1.1: Navigate
Navigate to the `backend` directory in your workspace:
```bash
cd backend
```

### Step 1.2: Environment Configuration
Copy the sample environment file to create your local configurations:
```bash
cp .env.example .env
```
Open `.env` and fill in the required variables:
```env
# Application Settings
ENVIRONMENT=development
DEBUG=true

# Database Settings (Supabase / PostgreSQL Pooler connection URL)
DATABASE_URL=postgresql+asyncpg://postgres.<your-project-id>:<your-password>@aws-0-<region>.pooler.supabase.com:6543/postgres

# Security Settings
JWT_SECRET_KEY=generate-a-secure-32-byte-hex-key
JWT_ALGORITHM=HS256
SUPER_ADMIN_SECRET=crimeLens@SuperAdmin2026

# AI Keys
GEMINI_API_KEY=AIzaSy...your-gemini-key
```

### Step 1.3: Install Dependencies
Create a virtual environment and install backend requirements:
```bash
# Create Virtual Environment
python -m venv .venv

# Activate Virtual Environment (Windows)
.venv\Scripts\activate

# Activate Virtual Environment (macOS/Linux)
source .venv/bin/activate

# Install Packages
pip install -r requirements.txt
```

### Step 1.4: Database Seeding
Create the database tables and seed the initial admin account (`admin@ksp.gov.in` / `admin123`) and demo case logs:
```bash
# Create database tables and Admin user
python create_admin.py

# Seed mock cases, timeline logs, and crime heads
python seed_data.py
```

### Step 1.5: Start Local Server
Start the development server with hot-reload enabled:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
You can access the interactive API docs at `http://localhost:8000/docs`.

---

## 2. ⚛️ Frontend Setup (React + Vite + TypeScript)

The frontend is a single-page application built using Vite, React, TypeScript, and TailwindCSS.

### Step 2.1: Navigate & Install
Navigate to the `frontend` folder and install dependencies:
```bash
cd ../frontend
npm install
```

### Step 2.2: Configure Environment
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Step 2.3: Start Local Server
Run the local Vite development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`. You can log in using:
*   **Email:** `admin@ksp.gov.in`
*   **Password:** `admin123`

### Step 2.4: Production Build
Verify the production bundler outputs compile cleanly:
```bash
npm run build
```
This builds static assets into the `dist/` directory, ready to serve via Nginx or static host.

---

## 3. 🐳 Docker Setup (Local Container)

You can containerize the backend to run in an isolated environment.

### Step 3.1: Build Image
Build the backend Docker image from the root directory:
```bash
docker build -t kritisp/crimelens-backend:1.5 .
```

### Step 3.2: Run Locally
Run the container locally and map port 8000:
```bash
docker run -d -p 8000:8000 --env-file backend/.env kritisp/crimelens-backend:1.5
```

---

## 4. 🚀 Zoho Catalyst AppSail Deployment

To deploy the backend to AppSail as a custom container:

### Step 4.1: Build & Push to Docker Hub
Ensure your latest changes are built and pushed to a public/private registry:
```bash
docker build -t <your-docker-username>/crimelens-backend:1.5 .
docker push <your-docker-username>/crimelens-backend:1.5
```

### Step 4.2: Update AppSail Configuration
Ensure `app-config.json` in the root workspace has correct deployment settings:
```json
{
  "command": "python index.py",
  "buildPath": ".",
  "stack": "python_3_12",
  "port": 8000,
  "memory": 1024
}
```

### Step 4.3: Add Environment Variables in Catalyst Console
Before deploying, log into your **Zoho Catalyst Console** and add the following keys to your AppSail service environment variables:
1.  `DATABASE_URL` — Supabase PgBouncer Pooler connection URL
2.  `GEMINI_API_KEY` — Your Google Gemini API Key
3.  `JWT_SECRET_KEY` — Secure JWT secret string
4.  `ENVIRONMENT` — `production` or `staging`

### Step 4.4: Deploy Service
Use Catalyst CLI or AppSail Online Console to redeploy.
If using the Online Console:
1.  Navigate to **AppSail** -> `crimelens-backend`.
2.  Paste the Docker image URL (e.g. `docker.io/<your-username>/crimelens-backend:1.5`).
3.  Click **Redeploy**.

Once AppSail initializes and passes the health check, it will expose your backend URL (e.g., `https://crimelens-backend-<id>.development.catalystappsail.in`). Configure this URL as `VITE_API_URL` on your frontend deployment.
