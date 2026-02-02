#!/usr/bin/env bash
# ============================================
# WashWise Health Check Script
# ============================================
# Usage: ./scripts/health-check.sh [service]
# Services: api, web, db, redis, all

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
API_URL="${API_URL:-http://localhost:3001}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"

# Print functions
print_status() {
  echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[  OK ]${NC} $1"
}

print_error() {
  echo -e "${RED}[FAIL]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

# Health check functions
check_api() {
  print_status "Checking API Server..."
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health" 2>/dev/null || echo "000")
  
  if [ "$response" = "200" ]; then
    print_success "API Server is healthy (${API_URL}/health)"
    
    # Get detailed health info
    health_data=$(curl -s "${API_URL}/health" 2>/dev/null)
    if [ -n "$health_data" ]; then
      echo "         Response: $health_data"
    fi
    return 0
  else
    print_error "API Server is not responding (HTTP $response)"
    return 1
  fi
}

check_web() {
  print_status "Checking Web Admin..."
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "${WEB_URL}" 2>/dev/null || echo "000")
  
  if [ "$response" = "200" ] || [ "$response" = "307" ] || [ "$response" = "302" ]; then
    print_success "Web Admin is healthy (${WEB_URL})"
    return 0
  else
    print_error "Web Admin is not responding (HTTP $response)"
    return 1
  fi
}

check_db() {
  print_status "Checking PostgreSQL..."
  
  if command -v pg_isready &> /dev/null; then
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -q 2>/dev/null; then
      print_success "PostgreSQL is accepting connections (${DB_HOST}:${DB_PORT})"
      return 0
    else
      print_error "PostgreSQL is not ready"
      return 1
    fi
  else
    # Fallback: try to connect with nc
    if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
      print_success "PostgreSQL port is open (${DB_HOST}:${DB_PORT})"
      return 0
    else
      print_error "PostgreSQL port is not accessible"
      return 1
    fi
  fi
}

check_redis() {
  print_status "Checking Redis..."
  
  if command -v redis-cli &> /dev/null; then
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>/dev/null | grep -q "PONG"; then
      print_success "Redis is responding (${REDIS_HOST}:${REDIS_PORT})"
      return 0
    else
      print_error "Redis is not responding"
      return 1
    fi
  else
    # Fallback: try to connect with nc
    if nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null; then
      print_success "Redis port is open (${REDIS_HOST}:${REDIS_PORT})"
      return 0
    else
      print_error "Redis port is not accessible"
      return 1
    fi
  fi
}

check_all() {
  echo ""
  echo "============================================"
  echo "  WashWise Health Check"
  echo "============================================"
  echo ""
  
  local failed=0
  
  check_db || ((failed++))
  check_redis || ((failed++))
  check_api || ((failed++))
  check_web || ((failed++))
  
  echo ""
  echo "============================================"
  
  if [ $failed -eq 0 ]; then
    print_success "All services are healthy! 🎉"
    return 0
  else
    print_error "$failed service(s) failed health check"
    return 1
  fi
}

# Main
case "${1:-all}" in
  api)
    check_api
    ;;
  web)
    check_web
    ;;
  db|database|postgres|postgresql)
    check_db
    ;;
  redis)
    check_redis
    ;;
  all|*)
    check_all
    ;;
esac
