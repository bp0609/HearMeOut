.PHONY: help install start stop restart logs clean db-migrate db-reset docker-up docker-down docker-logs test-ml

help:
	@echo "Daily Mood Journal - Development Commands"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make docker-up      - Start all services with Docker"
	@echo "  make docker-down    - Stop all Docker services"
	@echo "  make docker-logs    - View Docker logs"
	@echo "  make docker-restart - Restart Docker services"
	@echo ""
	@echo "Development Commands:"
	@echo "  make install        - Install all dependencies"
	@echo "  make start          - Start services locally"
	@echo "  make stop           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - View logs from all services"
	@echo "  make clean          - Clean all build artifacts and temp files"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-migrate     - Run database migrations"
	@echo "  make db-reset       - Reset database (WARNING: deletes all data)"
	@echo ""
	@echo "Testing:"
	@echo "  make test-ml        - Test ML service API"

install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing ML service dependencies..."
	cd ml-service && python3 -m pip install -r requirements.txt
	@echo "✓ All dependencies installed"

docker-up:
	@echo "Starting Docker services (PostgreSQL + ML Service)..."
	docker-compose up --build -d
	@echo "✓ Docker services started"
	@echo ""
	@echo "Services:"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - ML Service: localhost:8000"
	@echo ""
	@echo "Now start the backend locally:"
	@echo "  cd backend && npm run dev"
	@echo ""
	@echo "Run 'make docker-logs' to view logs"
	@echo "Run 'make test-ml' to test ML service"

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down
	@echo "✓ Services stopped"

docker-restart:
	@echo "Restarting Docker services..."
	docker-compose down
	docker-compose up --build -d
	@echo "✓ Services restarted"

docker-logs:
	docker-compose logs -f

start:
	@echo "Starting services..."
	@echo "1. Starting PostgreSQL and ML service with Docker..."
	docker-compose up -d
	@echo "2. Starting backend server..."
	cd backend && npm run dev &
	@echo "3. Starting frontend server..."
	cd frontend && npm run dev &
	@echo ""
	@echo "✓ All services started"
	@echo "  - PostgreSQL: localhost:5432 (Docker)"
	@echo "  - ML Service: localhost:8000 (Docker)"
	@echo "  - Backend: localhost:3001 (Local)"
	@echo "  - Frontend: localhost:5173 (Local)"

stop:
	@echo "Stopping all services..."
	docker-compose down
	@pkill -f "npm run dev" || true
	@pkill -f "python3 app.py" || true
	@echo "✓ All services stopped"

restart: stop start

logs:
	docker-compose logs -f

test-ml:
	@echo "Testing ML Service..."
	@echo ""
	cd ml-service && python3 test_api.py

clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/dist
	rm -rf frontend/dist
	rm -rf ml-service/__pycache__
	rm -rf backend/temp_audio/*
	rm -rf ml-service/.venv
	@echo "✓ Cleaned"

db-migrate:
	@echo "Running database migrations..."
	cd backend && npx prisma migrate dev
	@echo "✓ Migrations complete"

db-reset:
	@echo "⚠️  WARNING: This will delete all data!"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ]
	cd backend && npx prisma migrate reset --force
	@echo "✓ Database reset complete"
