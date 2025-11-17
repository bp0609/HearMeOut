.PHONY: help install docker-up docker-down docker-logs clean db-migrate db-reset test-ml

help:
	@echo "HearMeOut - Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install        - Install backend and frontend dependencies"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make docker-up      - Start PostgreSQL + ML Service (Docker)"
	@echo "  make docker-down    - Stop Docker services"
	@echo "  make docker-logs    - View Docker logs (Ctrl+C to exit)"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-migrate     - Run database migrations"
	@echo "  make db-reset       - Reset database (WARNING: deletes all data)"
	@echo ""
	@echo "Testing & Utilities:"
	@echo "  make test-ml        - Test ML service API"
	@echo "  make clean          - Clean build artifacts and temp files"
	@echo ""
	@echo "Development Workflow:"
	@echo "  1. make install"
	@echo "  2. make docker-up"
	@echo "  3. make db-migrate"
	@echo "  4. cd backend && npm run dev     (in terminal 1)"
	@echo "  5. cd frontend && npm run dev    (in terminal 2)"

install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo ""
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo ""
	@echo "✓ All dependencies installed"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Configure .env files (see SETUP.md)"
	@echo "  2. make docker-up"
	@echo "  3. make db-migrate"

docker-up:
	@echo "Starting Docker services (PostgreSQL + ML Service)..."
	docker-compose up --build -d
	@echo ""
	@echo "✓ Docker services started"
	@echo ""
	@echo "Services running:"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - ML Service: localhost:8000"
	@echo ""
	@echo "Next steps:"
	@echo "  1. make db-migrate (if first time)"
	@echo "  2. cd backend && npm run dev"
	@echo "  3. cd frontend && npm run dev"
	@echo ""
	@echo "Useful commands:"
	@echo "  - make docker-logs (view logs)"
	@echo "  - make test-ml (test ML service)"

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down
	@echo "✓ Docker services stopped"

docker-logs:
	@echo "Viewing Docker logs (Press Ctrl+C to exit)..."
	@echo ""
	docker-compose logs -f

test-ml:
	@echo "Testing ML Service API..."
	@echo ""
	@cd ml-service && python3 test_api.py || echo "Error: Python 3 is required to run tests"

clean:
	@echo "Cleaning build artifacts and temporary files..."
	rm -rf backend/dist
	rm -rf frontend/dist
	rm -rf ml-service/__pycache__
	rm -rf backend/temp_audio/*
	@echo "✓ Cleaned"

db-migrate:
	@echo "Running database migrations..."
	cd backend && npx prisma migrate dev
	cd backend && npx prisma generate
	@echo "✓ Database migrations complete"

db-reset:
	@echo "⚠️  WARNING: This will delete ALL data in the database!"
	@echo ""
	@read -p "Are you sure? Type 'yes' to confirm: " confirm && [ "$$confirm" = "yes" ]
	cd backend && npx prisma migrate reset --force
	@echo "✓ Database reset complete"
