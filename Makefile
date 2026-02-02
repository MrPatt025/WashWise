# ============================================
# WashWise Makefile
# ============================================
# Common development commands
# Run `make help` to see available commands
# ============================================

.PHONY: help install dev build test lint format clean docker-up docker-down db-migrate db-seed db-studio

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

# Help
help: ## Show this help message
	@echo ""
	@echo "$(BLUE)WashWise Development Commands$(NC)"
	@echo "=============================="
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

# Installation
install: ## Install all dependencies
	pnpm install

# Development
dev: ## Start development servers
	pnpm dev

dev-api: ## Start only API server
	pnpm --filter @washwise/api-server dev

dev-web: ## Start only web admin
	pnpm --filter @washwise/web-admin dev

# Building
build: ## Build all packages
	pnpm build

build-api: ## Build API server
	pnpm --filter @washwise/api-server build

build-web: ## Build web admin
	pnpm --filter @washwise/web-admin build

# Testing
test: ## Run all tests
	pnpm test

test-watch: ## Run tests in watch mode
	pnpm --filter @washwise/api-server test:watch

test-integration: ## Run integration tests
	pnpm test:integration

test-e2e: ## Run E2E tests
	pnpm test:e2e

# Code Quality
lint: ## Run linter
	pnpm lint

lint-fix: ## Fix linting issues
	pnpm lint:fix

format: ## Format code with Prettier
	pnpm format

format-check: ## Check code formatting
	pnpm format:check

typecheck: ## Run TypeScript type checking
	pnpm typecheck

# Cleaning
clean: ## Clean build artifacts
	pnpm clean

clean-all: ## Clean everything including node_modules
	pnpm clean
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules

# Docker
docker-up: ## Start Docker services
	docker-compose up -d

docker-down: ## Stop Docker services
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-ps: ## List Docker services
	docker-compose ps

docker-tools: ## Start Docker with dev tools (Adminer, Redis Commander)
	docker-compose --profile tools up -d

# Database
db-generate: ## Generate Prisma client
	pnpm db:generate

db-migrate: ## Run database migrations
	pnpm db:migrate

db-push: ## Push schema to database
	pnpm db:push

db-seed: ## Seed database with sample data
	pnpm db:seed

db-studio: ## Open Prisma Studio
	pnpm db:studio

db-reset: ## Reset database (WARNING: Deletes all data!)
	pnpm --filter @washwise/database exec prisma migrate reset

# Setup
setup: ## Initial project setup
	@./scripts/setup.sh

setup-windows: ## Initial project setup (Windows)
	@powershell -ExecutionPolicy Bypass -File scripts/setup.ps1

# Health Check
health: ## Check service health
	@./scripts/health-check.sh

# Release
changeset: ## Create a changeset
	pnpm changeset

version: ## Update versions based on changesets
	pnpm changeset version

release: ## Publish packages
	pnpm changeset publish

# Utilities
deps-update: ## Update dependencies
	pnpm update --interactive --latest

deps-audit: ## Audit dependencies for vulnerabilities
	pnpm audit

analyze: ## Analyze bundle size (web-admin)
	pnpm --filter @washwise/web-admin exec next build --analyze

# Git Hooks
prepare: ## Setup Git hooks
	pnpm prepare
