# ============================================
# WashWise Development Setup Script (Windows)
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  WashWise Development Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Helper functions
function Write-Step($message) {
    Write-Host "▶ $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "✓ $message" -ForegroundColor Green
}

function Write-Error($message) {
    Write-Host "✗ $message" -ForegroundColor Red
}

function Write-Warning($message) {
    Write-Host "! $message" -ForegroundColor Yellow
}

# Check prerequisites
Write-Host "Checking Prerequisites..." -ForegroundColor Cyan
Write-Host ""

$missing = 0

# Check Node.js
Write-Step "Checking Node.js..."
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node -v
    Write-Success "Node.js $nodeVersion installed"
} else {
    Write-Error "Node.js not found"
    $missing++
}

# Check pnpm
Write-Step "Checking pnpm..."
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    $pnpmVersion = pnpm -v
    Write-Success "pnpm $pnpmVersion installed"
} else {
    Write-Warning "pnpm not found, installing via corepack..."
    corepack enable
    corepack prepare pnpm@9.15.0 --activate
    Write-Success "pnpm installed"
}

# Check Docker
Write-Step "Checking Docker..."
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerVersion = docker --version
    Write-Success "Docker installed"
} else {
    Write-Error "Docker not found"
    $missing++
}

# Check Git
Write-Step "Checking Git..."
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitVersion = git --version
    Write-Success "Git installed"
} else {
    Write-Error "Git not found"
    $missing++
}

if ($missing -gt 0) {
    Write-Host ""
    Write-Error "Missing $missing prerequisite(s). Please install them and try again."
    exit 1
}

# Setup environment
Write-Host ""
Write-Host "Setting Up Environment..." -ForegroundColor Cyan
Write-Host ""

Write-Step "Setting up environment variables..."
if (-not (Test-Path .env)) {
    if (Test-Path .env.template) {
        Copy-Item .env.template .env
        Write-Success "Created .env from .env.template"
        Write-Warning "Please review and update .env with your values"
    } elseif (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Success "Created .env from .env.example"
    }
} else {
    Write-Success ".env file already exists"
}

# Install dependencies
Write-Host ""
Write-Host "Installing Dependencies..." -ForegroundColor Cyan
Write-Host ""

Write-Step "Installing npm packages..."
pnpm install
Write-Success "Dependencies installed"

# Start services
Write-Host ""
Write-Host "Starting Docker Services..." -ForegroundColor Cyan
Write-Host ""

Write-Step "Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis
Start-Sleep -Seconds 5
Write-Success "Docker services started"

# Setup database
Write-Host ""
Write-Host "Setting Up Database..." -ForegroundColor Cyan
Write-Host ""

Write-Step "Generating Prisma client..."
pnpm db:generate
Write-Success "Prisma client generated"

Write-Step "Running database migrations..."
try {
    pnpm db:migrate
} catch {
    pnpm db:push
}
Write-Success "Database schema applied"

# Setup hooks
Write-Host ""
Write-Host "Setting Up Git Hooks..." -ForegroundColor Cyan
Write-Host ""

Write-Step "Installing Husky hooks..."
pnpm prepare
Write-Success "Git hooks installed"

# Final output
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! 🎉" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your WashWise development environment is ready!"
Write-Host ""
Write-Host "Quick Start Commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  pnpm dev          - Start all services in development mode" -ForegroundColor Yellow
Write-Host "  pnpm build        - Build all packages" -ForegroundColor Yellow
Write-Host "  pnpm test         - Run tests" -ForegroundColor Yellow
Write-Host "  pnpm lint         - Run linter" -ForegroundColor Yellow
Write-Host "  pnpm db:studio    - Open Prisma Studio" -ForegroundColor Yellow
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  🌐 Web Admin:     http://localhost:3000"
Write-Host "  🚀 API Server:    http://localhost:3001"
Write-Host "  📚 API Docs:      http://localhost:3001/docs"
Write-Host "  🗄️  Prisma Studio: http://localhost:5555"
Write-Host ""
Write-Host "Happy coding! 💻"
Write-Host ""
