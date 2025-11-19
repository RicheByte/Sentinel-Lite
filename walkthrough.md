# Sentinel-Lite Walkthrough

This guide explains how to run and verify the Sentinel-Lite SIEM system.

## Prerequisites

- Docker & Docker Compose (Recommended)
- OR Python 3.8+ & Node.js 16+

## 1. Running the System

### Option A: Docker (Recommended)

The easiest way to run Sentinel-Lite is with Docker.

```bash
docker-compose up -d --build
```

- **Dashboard**: `http://localhost:5173`
- **API**: `http://localhost:8000`

To stop the system:

```bash
docker-compose down
```

### Option B: Manual Setup

If you prefer running locally without Docker:

#### 1. The Brain (Backend)

```bash
cd brain
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### 2. The Eye (Frontend)

```bash
cd eye
npm install
npm run dev
```

Open `http://localhost:5173`.

#### 3. The Agent (Client)

```bash
cd agent
pip install -r requirements.txt
python log_shipper.py
```

## 2. Verification (The Demo)

To simulate a cyber attack (Brute Force), run the generator script.

**If using Docker:**

```bash
# Run inside the agent container
docker-compose exec agent python ../tests/brute_force_gen.py
```

_Note: The generator writes to `access.log` which is mounted in the agent container._

**If running manually:**

```bash
python tests/brute_force_gen.py
```

### What to Expect

1.  **Log Stream**: You will see new logs appearing in the "Live Logs" section of the Dashboard.
2.  **Alerts**: After a few failed login attempts, a **Critical Alert** ("Brute Force Detect") will appear in the "Security Alerts" panel.
3.  **Stats**: The "Total Logs" and "Total Alerts" charts will update in real-time.

## 3. Troubleshooting

- **No Logs?** Ensure the Agent is running and watching `access.log`.
- **Docker Issues?** Ensure Docker Desktop is running.
