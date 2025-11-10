.PHONY: help install start stop restart logs clean db-migrate db-reset

help:
	@echo "Daily Mood Journal - Development Commands"
	@echo ""
	@echo "make install      - Install all dependencies"
	@echo "make start        - Start all services"
	@echo "make stop         - Stop all services"
	@echo "make restart      - Restart all services"
	@echo "make logs         - View logs from all services"
	@echo "make clean        - Clean all build artifacts and temp files"
	@echo "make db-migrate   - Run database migrations"
	@echo "make db-reset     - Reset database (WARNING: deletes all data)"

install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing ML service dependencies..."
	cd ml-service && pip install -r requirements.txt
	@echo "✓ All dependencies installed"

start:
	@echo "Starting services with Docker Compose..."
	docker-compose up -d
	@echo "Starting backend server..."
	cd backend && npm run dev &
	@echo "Starting frontend server..."
	cd frontend && npm run dev &
	@echo "✓ All services started"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:5001"
	@echo "ML Service: http://localhost:8000"

stop:
	@echo "Stopping all services..."
	docker-compose down
	@pkill -f "npm run dev" || true
	@echo "✓ All services stopped"

restart: stop start

logs:
	docker-compose logs -f

clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/dist
	rm -rf frontend/dist
	rm -rf ml-service/__pycache__
	rm -rf temp_audio/*
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
