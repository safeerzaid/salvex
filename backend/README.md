# Salvex Auction Platform — FastAPI & PostgreSQL Backend Setup (Windows)

This document provides setup instructions for running the FastAPI + PostgreSQL backend on Windows.

---

## 1. Prerequisites

- **Python 3.12+** (Verified: `python --version`)
- **PostgreSQL 14+** (PostgreSQL 17 service detected running locally on port 5432)

---

## 2. Setup Virtual Environment

From the project root:

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment named .venv
python -m venv .venv

# Activate virtual environment on Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

*(If PowerShell script execution is restricted, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*

---

## 3. Install Dependencies

With the virtual environment activated:

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 4. Configure Environment Variables

Create `.env` from `.env.example`:

```powershell
Copy-Item .env.example .env
```

Edit `.env` to configure your local PostgreSQL credentials:

```ini
APP_ENV=development
APP_HOST=127.0.0.1
APP_PORT=8000
APP_SECRET_KEY=salvex_development_secret_key_minimum_32_characters_long

# PostgreSQL Async Connection URL
# Replace 'your_pg_password' with your local postgres user password
DATABASE_URL=postgresql+asyncpg://postgres:your_pg_password@localhost:5432/salvex_auction

# Allowed Frontend Origins (CORS)
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> **Note:** The backend strictly validates that `DATABASE_URL` starts with `postgresql://` or `postgresql+asyncpg://`. It will fail explicitly if non-PostgreSQL databases are configured.

---

## 5. PostgreSQL Database Creation

Ensure a database named `salvex_auction` exists in your PostgreSQL instance:

```powershell
# Using psql command line:
psql -U postgres -c "CREATE DATABASE salvex_auction;"
```

---

## 6. Run Backend Tests

Execute pytest suite:

```powershell
pytest
```

---

## 7. Start the FastAPI Development Server

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 8. Verify Health & Readiness Endpoints

Open browser or PowerShell:

```powershell
# 1. Process Liveness Check:
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/health
# Response: {"status": "online", "service": "Salvex Auction Platform API", "timestamp": "..."}

# 2. Database Readiness Check:
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/ready
# Response (DB connected): {"status": "ready", "database": "connected", "timestamp": "..."}
# Response (DB offline / unconfigured): HTTP 503 {"status": "not_ready", "database": "...", "timestamp": "..."}

# 3. Interactive OpenAPI Docs (Swagger):
# Visit: http://127.0.0.1:8000/docs
```
