# HearMeOut - Setup Guide

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **Docker** and Docker Compose
- **Clerk** account (free at [clerk.com](https://clerk.com))

## Quick Start

### 1. Get Clerk API Keys

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy from API Keys page:
   - **Publishable Key**: `pk_test_...`
   - **Secret Key**: `sk_test_...`

### 2. Configure Environment

**Copy example environment files:**

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

**Update `backend/.env` with your values:**

```bash
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>"
CLERK_SECRET_KEY="sk_test_your_secret_key_here"  # Replace with your Clerk secret key
ML_SERVICE_URL="http://localhost:8000"
PORT=5001
DEV_IP="<host-ip>"
```

**Update `frontend/.env` with your values:**

```bash
VITE_CLERK_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"  # Replace with your Clerk publishable key
VITE_API_URL="http://<ip-of-host>:5001"
```

> **Note:** Get your Clerk API keys from the dashboard (step 1). Use `localhost` for local development, or your machine's IP address

### 3. Install Dependencies

**Option A: Using Makefile (Recommended)**

```bash
make install        # Install backend and frontend dependencies
```

**Option B: Manual Installation**

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Download ML Model

Download the pre-trained model from [OneDrive Link](https://iitgnacin-my.sharepoint.com/:u:/g/personal/22110098_iitgn_ac_in1/ERKzT030GVdHo8w0YrRFEvABpVxMuRPxxTZjXlU1SLsi7w?e=ppMZGc) and extract to `ml-service/wav2vec2-lg-xlsr-en-speech-emotion-recognition/` folder.

### 5. Start Services

```bash
# Start Docker services (PostgreSQL + ML Service)
make docker-up

# Run database migrations (first time only)
make db-migrate

# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2)
cd frontend && npm run dev
```

### 6. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **ML Service**: http://localhost:8000

**First startup:** ML service takes 1-2 minutes to load models. Check logs: `docker-compose logs -f ml-service`

## Development Workflow

### Database Management

```bash
# View database in browser
cd backend && npx prisma studio

# Run migrations
make db-migrate

# Reset database (WARNING: deletes all data)
make db-reset

# Create new migration (manual)
cd backend
npx prisma migrate dev --name migration_name
```

### ML Service

**Testing:**

```bash
# Test ML service (ensure it's running)
make test-ml
```

**Troubleshooting:**

```bash
# View ML service logs
make docker-logs

# Rebuild ML service if needed
docker-compose down
docker-compose build ml-service
docker-compose up -d
```

**Note:** ML service takes 1-2 minutes to load models on first startup.
|

## Adding Features

### New API Endpoint

1. Create route in `backend/src/routes/`
2. Register in `backend/src/app.ts`
3. Update `frontend/src/lib/api.ts`

### Database Changes

```bash
# Edit backend/prisma/schema.prisma
npx prisma migrate dev --name change_description
npx prisma generate
```

### UI Components

```bash
cd frontend
npx shadcn-ui@latest add <component-name>
```

## Testing

```bash

# ML service health check
curl http://localhost:8000/

# Test mood entry creation (requires authentication)
curl -X POST http://localhost:5001/api/moods \
  -H "Authorization: Bearer <your_clerk_token>" \
  -F "audio=@test_audio.webm" \
  -F "language=en" \
  -F "duration=30"
```

## Useful Commands

```bash
# View all available commands
make help

# Docker
make docker-up      # Start PostgreSQL + ML Service
make docker-down    # Stop Docker services
make docker-logs    # View Docker logs (live)

# Database
make db-migrate     # Run migrations
make db-studio      # Open Prisma Studio
make db-reset       # Reset database (with confirmation)

# Testing & Utilities
make test-ml        # Test ML service
make clean          # Clean build artifacts and temp files

# Manual Docker commands
docker-compose ps                    # List running services
docker-compose logs -f ml-service    # Follow ML service logs only
docker-compose down -v               # Stop and remove volumes
```

---

For detailed API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
