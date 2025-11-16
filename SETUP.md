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

**Backend** (`backend/.env`):
```bash
DATABASE_URL="postgresql://admin:devpassword@localhost:5432/mood_journal"
CLERK_SECRET_KEY="sk_test_your_secret_key_here"
ML_SERVICE_URL="http://ml-service:8000"
PORT=5001
```

**Frontend** (`frontend/.env`):
```bash
VITE_CLERK_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
VITE_API_URL="http://localhost:5001"
```

### 3. Install & Start

**Option A: Using Makefile (Recommended)**
```bash
make install        # Install all dependencies
make docker-up      # Start PostgreSQL + ML Service
make db-migrate     # Run database migrations
```

Then in separate terminals:
```bash
cd backend && npm run dev
cd frontend && npm run dev
```

**Option B: Manual Setup**
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start Docker services
docker-compose up -d

# Setup database
cd backend
npx prisma migrate dev
npx prisma generate

# Start services (in separate terminals)
npm run dev          # Backend
cd ../frontend && npm run dev  # Frontend
```

### 4. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **ML Service**: http://localhost:8000

**First startup:** ML service takes 1-2 minutes to load models. Check logs: `docker-compose logs -f ml-service`

## Development Workflow

### Database Management

```bash
# View database in browser
cd backend && npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### ML Service

**First startup:** Downloads wav2vec2 model (~500MB) automatically. Takes 1-2 minutes.

```bash
# Rebuild ML service
docker-compose build ml-service
docker-compose up ml-service

# Test ML service
make test-ml
# or
python ml-service/test_api.py
```

### Hot Reloading

- **Frontend**: Vite provides instant HMR
- **Backend**: tsx auto-restarts on file changes

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Module not found** | `cd backend && npm install`<br>`cd frontend && npm install` |
| **Database connection fails** | Check PostgreSQL: `docker ps`<br>Restart: `docker-compose restart postgres` |
| **ML Service timeout** | First startup takes 1-2 min<br>Check: `docker-compose logs ml-service`<br>Rebuild: `docker-compose build ml-service` |
| **Clerk auth fails** | Verify `.env` keys match Clerk dashboard<br>Clear browser cache |
| **Microphone blocked** | Use Chrome/Edge, check browser permissions<br>Must be HTTPS or localhost |
| **Port already in use** | Change port in `.env` or kill process:<br>`lsof -ti:5001 \| xargs kill` |

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
# Backend health check
curl http://localhost:5001/health

# ML service health check
curl http://localhost:8000/

# Test ML service
make test-ml
```

## Useful Commands

```bash
# Makefile shortcuts
make help           # Show all commands
make docker-logs    # View all Docker logs
make clean          # Clean temp files

# Docker commands
docker-compose ps                    # List running services
docker-compose logs -f ml-service    # Follow ML service logs
docker-compose down -v               # Stop and remove volumes

# Database
npx prisma studio   # Visual database browser
npx prisma db push  # Quick schema sync (dev only)
```

## Production Deployment

**Environment Variables:**
- `NODE_ENV=production`
- `DATABASE_URL` (production PostgreSQL)
- `CLERK_SECRET_KEY` (production keys)
- `ML_SERVICE_URL` (production ML service)

**Build:**
```bash
cd frontend && npm run build    # Output: dist/
cd backend && npm run build     # Output: dist/
```

**Checklist:**
- [ ] Update CORS origins
- [ ] Use production Clerk keys
- [ ] Enable SSL/HTTPS
- [ ] Configure rate limiting
- [ ] Set up monitoring
- [ ] Enable database backups

---

For detailed API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
