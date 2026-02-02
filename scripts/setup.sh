#!/usr/bin/env bash
# ============================================
# WashWise Development Setup Script
# ============================================
# Automates the initial development environment setup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Print functions
print_header() {
  echo ""
  echo -e "${CYAN}============================================${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}============================================${NC}"
  echo ""
}

print_step() {
  echo -e "${BLUE}▶${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}!${NC} $1"
}

# Check prerequisites
check_prerequisites() {
  print_header "Checking Prerequisites"
  
  local missing=0
  
  # Check Node.js
  print_step "Checking Node.js..."
  if command -v node &> /dev/null; then
    node_version=$(node -v)
    print_success "Node.js $node_version installed"
    
    # Check version >= 22
    major_version=$(echo "$node_version" | sed 's/v//' | cut -d. -f1)
    if [ "$major_version" -lt 22 ]; then
      print_warning "Node.js 22+ recommended. Current: $node_version"
    fi
  else
    print_error "Node.js not found"
    ((missing++))
  fi
  
  # Check pnpm
  print_step "Checking pnpm..."
  if command -v pnpm &> /dev/null; then
    pnpm_version=$(pnpm -v)
    print_success "pnpm $pnpm_version installed"
  else
    print_warning "pnpm not found, will install via corepack"
    corepack enable
    corepack prepare pnpm@9.15.0 --activate
    print_success "pnpm installed via corepack"
  fi
  
  # Check Docker
  print_step "Checking Docker..."
  if command -v docker &> /dev/null; then
    docker_version=$(docker --version | cut -d' ' -f3 | tr -d ',')
    print_success "Docker $docker_version installed"
  else
    print_error "Docker not found"
    ((missing++))
  fi
  
  # Check Docker Compose
  print_step "Checking Docker Compose..."
  if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    print_success "Docker Compose installed"
  else
    print_error "Docker Compose not found"
    ((missing++))
  fi
  
  # Check Git
  print_step "Checking Git..."
  if command -v git &> /dev/null; then
    git_version=$(git --version | cut -d' ' -f3)
    print_success "Git $git_version installed"
  else
    print_error "Git not found"
    ((missing++))
  fi
  
  if [ $missing -gt 0 ]; then
    echo ""
    print_error "Missing $missing prerequisite(s). Please install them and try again."
    exit 1
  fi
}

# Setup environment
setup_environment() {
  print_header "Setting Up Environment"
  
  # Copy .env file if not exists
  print_step "Setting up environment variables..."
  if [ ! -f .env ]; then
    if [ -f .env.template ]; then
      cp .env.template .env
      print_success "Created .env from .env.template"
      print_warning "Please review and update .env with your values"
    elif [ -f .env.example ]; then
      cp .env.example .env
      print_success "Created .env from .env.example"
    else
      print_error "No .env template found"
    fi
  else
    print_success ".env file already exists"
  fi
}

# Install dependencies
install_dependencies() {
  print_header "Installing Dependencies"
  
  print_step "Installing npm packages..."
  pnpm install
  print_success "Dependencies installed"
}

# Start services
start_services() {
  print_header "Starting Docker Services"
  
  print_step "Starting PostgreSQL and Redis..."
  docker-compose up -d postgres redis
  
  # Wait for services to be ready
  print_step "Waiting for services to be ready..."
  sleep 5
  
  # Check if services are running
  if docker-compose ps | grep -q "postgres.*Up"; then
    print_success "PostgreSQL is running"
  else
    print_error "PostgreSQL failed to start"
  fi
  
  if docker-compose ps | grep -q "redis.*Up"; then
    print_success "Redis is running"
  else
    print_error "Redis failed to start"
  fi
}

# Setup database
setup_database() {
  print_header "Setting Up Database"
  
  print_step "Generating Prisma client..."
  pnpm db:generate
  print_success "Prisma client generated"
  
  print_step "Running database migrations..."
  pnpm db:migrate || pnpm db:push
  print_success "Database schema applied"
  
  # Optional: Seed database
  read -p "Do you want to seed the database with sample data? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Seeding database..."
    pnpm db:seed
    print_success "Database seeded"
  fi
}

# Setup Git hooks
setup_hooks() {
  print_header "Setting Up Git Hooks"
  
  print_step "Installing Husky hooks..."
  pnpm prepare
  print_success "Git hooks installed"
}

# Final instructions
print_final() {
  print_header "Setup Complete! 🎉"
  
  echo "Your WashWise development environment is ready!"
  echo ""
  echo "Quick Start Commands:"
  echo ""
  echo "  ${CYAN}pnpm dev${NC}          - Start all services in development mode"
  echo "  ${CYAN}pnpm build${NC}        - Build all packages"
  echo "  ${CYAN}pnpm test${NC}         - Run tests"
  echo "  ${CYAN}pnpm lint${NC}         - Run linter"
  echo "  ${CYAN}pnpm db:studio${NC}    - Open Prisma Studio"
  echo ""
  echo "Services:"
  echo ""
  echo "  🌐 Web Admin:     http://localhost:3000"
  echo "  🚀 API Server:    http://localhost:3001"
  echo "  📚 API Docs:      http://localhost:3001/docs"
  echo "  🗄️  Prisma Studio: http://localhost:5555"
  echo ""
  echo "Happy coding! 💻"
  echo ""
}

# Main
main() {
  print_header "WashWise Development Setup"
  
  check_prerequisites
  setup_environment
  install_dependencies
  start_services
  setup_database
  setup_hooks
  print_final
}

main
