# HearMeOut - Setup Guide

## Quick Setup (5 minutes)

### 1. Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Docker and Docker Compose
- Clerk account (free)

### 2. Get Clerk API Keys

1. Go to [clerk.com](https://clerk.com) and create a free account
2. Create a new application
3. Copy your keys from the API Keys page:
   - **Publishable Key**: `pk_test_...`
   - **Secret Key**: `sk_test_...`

### 3. Configure Environment Variables

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env and add:
# CLERK_SECRET_KEY="sk_test_your_key_here"

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env and add:
# VITE_CLERK_PUBLISHABLE_KEY="pk_test_your_key_here"
```

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# ML Service (in Docker - will install automatically)
```

### 5. Start Services

**Terminal 1 - Docker Services (PostgreSQL + ML Service):**

```bash
docker-compose up
```

Wait for "ML Service initialized successfully!" message (1-2 minutes on first run).

**Terminal 2 - Backend:**

```bash
cd backend
npx prisma migrate dev  # Run migrations
npm run dev
```

**Terminal 3 - Frontend:**

```bash
cd frontend
npm run dev
```

### 6. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **ML Service**: http://localhost:8000

## Detailed Setup Instructions

### Database Setup

The PostgreSQL database runs in Docker. On first run:

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### ML Service Setup

The ML service automatically downloads required models on first startup:

- **Emotion Model**: wav2vec2 (~500MB)
- **Whisper Model**: base (~150MB)

This happens inside the Docker container. First startup takes 1-2 minutes.

To rebuild the ML service:

```bash
docker-compose build ml-service
docker-compose up ml-service
```

### Frontend Development

The frontend uses:

- **Vite** for fast HMR
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **Clerk** for authentication

Hot reloading is enabled - changes appear instantly.

### Backend Development

The backend uses:

- **tsx** for TypeScript execution with watch mode
- **Prisma** for database ORM
- **Express** for API server

Changes trigger auto-restart.

## Common Issues

### Issue: "Module not found" errors

**Solution:**

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Issue: Database connection errors

**Solution:**

```bash
# Check if PostgreSQL is running
docker ps

# Restart database
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Issue: ML Service timeout

**Solution:**

```bash
# Check ML service logs
docker-compose logs ml-service

# Ensure models downloaded
docker-compose exec ml-service python -c "import whisper; whisper.load_model('base')"

# Rebuild if needed
docker-compose build --no-cache ml-service
docker-compose up ml-service
```

### Issue: Clerk authentication not working

**Solution:**

1. Verify keys in both `.env` files
2. Check Clerk dashboard for app status
3. Ensure keys match (same app)
4. Clear browser cache and cookies
5. Check browser console for errors

### Issue: Microphone not accessible

**Solution:**

1. Use Chrome or Edge browser
2. Ensure HTTPS or localhost
3. Check browser permissions
4. Grant microphone access when prompted

## Development Workflow

### Making Database Changes

```bash
cd backend

# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name your_migration_name

# 3. Generate client
npx prisma generate
```

### Adding New API Endpoints

1. Create route in `backend/src/routes/`
2. Add to `backend/src/app.ts`
3. Update API client in `frontend/src/lib/api.ts`
4. Update types in `frontend/src/types/index.ts`

### Adding New Components

```bash
# Use shadcn/ui CLI to add components
cd frontend
npx shadcn-ui@latest add <component-name>
```

## Testing

### Test Backend API

```bash
# Health check
curl http://localhost:5001/health

# Test authenticated endpoint (need token from Clerk)
curl http://localhost:5001/api/moods \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

### Test ML Service

```bash
# Health check
curl http://localhost:8000/health

# Test analysis (need audio file)
curl -X POST http://localhost:8000/analyze \
  -F "audio=@test.wav" \
  -F "language=en"
```

## Production Deployment

### Environment Variables

Set these in production:

- `NODE_ENV=production`
- `DATABASE_URL` (production database)
- `CLERK_SECRET_KEY` (production key)
- `ML_SERVICE_URL` (production ML service URL)

### Build Commands

```bash
# Frontend
cd frontend
npm run build
# Output: dist/

# Backend
cd backend
npm run build
# Output: dist/

# ML Service
# Use Dockerfile (already production-ready)
```

### Deployment Checklist

- [ ] Update CORS origins in backend
- [ ] Set production database URL
- [ ] Use production Clerk keys
- [ ] Enable SSL/HTTPS
- [ ] Set up health checks
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Enable database backups
- [ ] Configure rate limiting

## Useful Commands

```bash
# Reset database (WARNING: deletes all data)
cd backend
npx prisma migrate reset

# View database
npx prisma studio

# Check Docker services
docker-compose ps
docker-compose logs -f

# Stop all services
docker-compose down

# Clean Docker volumes
docker-compose down -v

# Backend logs
cd backend
npm run dev 2>&1 | tee logs.txt

# Frontend build
cd frontend
npm run build
npm run preview  # Preview production build
```

## Architecture Overview

```
User Browser
    ↓ (HTTPS)
Frontend (React/Vite)
    ↓ (REST API + JWT)
Backend (Express/Node)
    ↓ (Prisma)         ↓ (HTTP)
PostgreSQL        ML Service (Flask/Python)
                       ↓
                  HuggingFace + Whisper
```

## Key Files

- `docker-compose.yml` - Container orchestration
- `backend/prisma/schema.prisma` - Database schema
- `backend/src/app.ts` - Express app setup
- `backend/src/routes/` - API endpoints
- `frontend/src/App.tsx` - React app root
- `frontend/src/lib/api.ts` - API client
- `ml-service/app.py` - Flask ML service

## Support

For issues:

1. Check this guide
2. Check browser console (F12)
3. Check backend terminal output
4. Check Docker logs: `docker-compose logs`
5. Review README.md troubleshooting section

## Next Steps

After setup:

1. Sign up at http://localhost:5173
2. Complete language selection
3. Record your first mood entry
4. View calendar and progress
5. Customize settings

Happy tracking! 🎙️💚
