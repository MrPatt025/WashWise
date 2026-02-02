# WashWise - Smart Laundromat Management Platform

<div align="center">

![WashWise Logo](docs/assets/logo.png)

**Enterprise-grade, AI-powered SaaS platform for smart laundromat management**

[![CI](https://github.com/washwise/washwise/workflows/CI/badge.svg)](https://github.com/washwise/washwise/actions?query=workflow%3ACI)
[![Coverage](https://codecov.io/gh/washwise/washwise/branch/main/graph/badge.svg)](https://codecov.io/gh/washwise/washwise)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.15-orange.svg)](https://pnpm.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Demo](https://demo.washwise.io) • [Documentation](docs/) • [API Reference](docs/04-API.md) • [Contributing](CONTRIBUTING.md)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

WashWise is a **production-ready, multi-tenant SaaS platform** designed to revolutionize laundromat
operations through intelligent automation and AI-powered customer experiences.

### Key Features

| Feature                    | Description                                                          |
| -------------------------- | -------------------------------------------------------------------- |
| 🏢 **Multi-Tenant**        | Full tenant isolation with separate data, billing, and customization |
| 🤖 **AI-Powered**          | Natural language chatbot, demand forecasting, anomaly detection      |
| 📱 **Real-Time**           | WebSocket-based live machine status and notifications                |
| 💳 **Payments**            | PromptPay, credit card, and wallet integration                       |
| 📊 **Analytics**           | Revenue insights, usage patterns, and custom reports                 |
| 🔒 **Enterprise Security** | OAuth2/OIDC, RBAC/ABAC, OWASP Top 10 compliant                       |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22+ ([Download](https://nodejs.org/))
- **pnpm** 9+ (`corepack enable && corepack prepare pnpm@9 --activate`)
- **Docker** & Docker Compose ([Download](https://docs.docker.com/get-docker/))
- **Git** ([Download](https://git-scm.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/washwise/washwise.git
cd washwise

# Run setup script (Linux/macOS)
./scripts/setup.sh

# Or on Windows
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

### Manual Setup

```bash
# Install dependencies
pnpm install

# Start Docker services (PostgreSQL, Redis)
docker-compose up -d

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Access Points

| Service        | URL                                       |
| -------------- | ----------------------------------------- |
| 🌐 Web Admin   | [http://localhost:3000](http://localhost:3000) |
| 🚀 API Server  | [http://localhost:3001](http://localhost:3001) |
| 📚 API Docs    | [http://localhost:3001/docs](http://localhost:3001/docs) |
| 🗄️ DB Studio   | [http://localhost:5555](http://localhost:5555) |
| 📊 Adminer     | [http://localhost:8080](http://localhost:8080) (with `--profile tools`) |

---

## 🏗 Architecture

### Enterprise Tech Stack

| Layer              | Technology                | Purpose                              |
| ------------------ | ------------------------- | ------------------------------------ |
| **Core API**       | Java 21 + Spring Boot 4.x | Main business logic, Virtual Threads |
| **AI Worker**      | Python 3.12 + FastAPI     | LLM integration, ML pipelines        |
| **Frontend**       | Next.js 16 + React 19     | Admin dashboard, Customer app        |
| **Database**       | PostgreSQL 17 + pgvector  | Relational data + vector embeddings  |
| **Cache**          | Redis 7                   | Caching, Pub/Sub, Rate limiting      |
| **AI/ML**          | LangChain + CrewAI        | Multi-agent AI orchestration         |
| **Infrastructure** | AWS ECS Fargate           | Serverless containers                |
| **IaC**            | Terraform                 | Infrastructure as Code               |

### Current Implementation (MVP)

| Layer          | Technology                                         |
| -------------- | -------------------------------------------------- |
| **Monorepo**   | Turborepo v2 + pnpm v9                             |
| **Frontend**   | Next.js 16 (App Router), React 19, TypeScript 5.9+ |
| **State**      | TanStack Query v5 (Server), Zustand v5 (Client)    |
| **UI**         | Tailwind CSS v4, Shadcn UI, Lucide React           |
| **Backend**    | Node.js 22 LTS, Fastify v5                         |
| **Validation** | Zod v3.25                                          |
| **Real-time**  | Socket.io v4 + Redis 7                             |
| **Database**   | PostgreSQL 17 + Prisma v7                          |
| **Testing**    | Vitest v3 + Playwright + Testcontainers            |

### Repository Structure

```
washwise/
├── apps/
│   ├── api-server/          # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── services/    # Business logic
│   │   │   ├── plugins/     # Fastify plugins
│   │   │   ├── socket/      # Socket.io handlers
│   │   │   └── tests/       # Integration tests
│   │   └── package.json
│   └── web-admin/           # Next.js admin dashboard
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   ├── components/  # UI components
│       │   ├── hooks/       # Custom hooks
│       │   ├── lib/         # Utilities
│       │   └── stores/      # Zustand stores
│       └── package.json
├── packages/
│   ├── database/            # Prisma schema & client
│   ├── types/               # Shared Zod schemas & types
│   └── config/              # Shared configuration
├── services/
│   ├── core-api/            # Java Spring Boot API
│   └── ai-worker/           # Python AI/ML service
├── e2e/                     # Playwright E2E tests
├── observability/           # Prometheus, Grafana configs
├── scripts/                 # Development scripts
├── docker/                  # Dockerfiles
├── docker-compose.yml       # Development services
└── docker-compose.prod.yml  # Production deployment
```

---

## 💻 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all services
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm lint             # Run linter
pnpm format           # Format code

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database

# Docker
docker-compose up -d              # Start services
docker-compose --profile tools up -d  # Start with dev tools
docker-compose down               # Stop services
```

### VS Code Workspace

Open `washwise.code-workspace` for the best development experience with:
- Pre-configured launch configurations
- Recommended extensions
- Custom tasks

---

## 🔐 Security Features

### Dual-Token Authentication System

- **Access Token (15 min)**: Stored in memory only, never persisted
- **Refresh Token (7 days)**: HttpOnly cookie, automatic rotation
- **Token Rotation**: New refresh token issued on every refresh request
- **Reuse Detection**: Token theft detection via familyId tracking
  - If a stolen token is reused, entire token family is invalidated

### Multi-Tenant Security

- **Row-Level Isolation**: All data filtered by `tenantId`
- **IDOR Protection**: Cross-tenant access returns 404 (not 403)
- **Request Context**: `tenantId` injected from JWT into every request

### Password Security

- **Argon2id**: OWASP-recommended password hashing
- **Password Policy**: Minimum 8 characters (configurable)

---

## 📚 Documentation

Comprehensive enterprise documentation is available in the [docs/](docs/) folder:

| Document                                        | Description                                              |
| ----------------------------------------------- | -------------------------------------------------------- |
| [01-PRD.md](docs/01-PRD.md)                     | Product Requirements - personas, user journeys, features |
| [02-ARCHITECTURE.md](docs/02-ARCHITECTURE.md)   | System architecture - microservices, data flows          |
| [03-DATABASE.md](docs/03-DATABASE.md)           | Database design - PostgreSQL, MongoDB, Redis             |
| [04-API.md](docs/04-API.md)                     | REST API specifications - endpoints, payloads            |
| [05-SECURITY.md](docs/05-SECURITY.md)           | Security design - OAuth2, RBAC, OWASP compliance         |
| [06-DEVOPS.md](docs/06-DEVOPS.md)               | DevOps & CI/CD - GitHub Actions, Terraform               |
| [07-OBSERVABILITY.md](docs/07-OBSERVABILITY.md) | Monitoring - metrics, logging, tracing                   |
| [08-ROADMAP.md](docs/08-ROADMAP.md)             | Roadmap & Business Plan - phases, pricing                |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22 LTS (`nvm use` will use .nvmrc)
- pnpm 9.x (`npm install -g pnpm`)
- Docker & Docker Compose

### Quick Start

```bash
# Clone and install
git clone <repository-url>
cd washwise
pnpm install

# Start infrastructure
docker-compose up -d

# Setup environment
cp .env.example apps/api-server/.env
cp apps/web-admin/.env.example apps/web-admin/.env.local

# Initialize database
pnpm db:generate
pnpm db:push
pnpm db:seed

# Start development servers
pnpm dev
```

### Available Scripts

```bash
pnpm dev          # Start all apps in development mode
pnpm build        # Build all packages and apps
pnpm lint         # Run ESLint across all packages
pnpm test         # Run unit tests
pnpm test:int     # Run integration tests (requires Docker)
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:migrate   # Create and run migrations
pnpm db:seed      # Seed database with demo data
pnpm db:studio    # Open Prisma Studio
```

---

## 🛠 Local Development Guide

This guide helps you run services locally without rebuilding Docker containers for every code
change.

### Prerequisites

- **Java 21+** for Core API (`java -version`)
- **Maven 3.9+** for Core API (`mvn -version`)
- **Node.js 22 LTS** for frontend (`node -v`)
- **pnpm 9.x** for package management (`pnpm -v`)
- **Docker** for infrastructure (PostgreSQL, Redis)

### Step 1: Start Infrastructure Only

```bash
# Start only PostgreSQL and Redis (not the app containers)
docker-compose up -d postgres redis
```

### Step 2: Run Core API (Spring Boot)

```bash
# Navigate to core-api directory
cd services/core-api

# Run with Maven (hot-reload enabled by default)
mvn spring-boot:run

# Or with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Core API runs on http://localhost:8080
```

**Environment variables** (set in terminal or `.env` file):

```bash
export DATABASE_URL=jdbc:postgresql://localhost:5432/washwise
export REDIS_HOST=localhost
export REDIS_PORT=6379
export JWT_SECRET=your-dev-secret-key
```

### Step 3: Run Frontend (Next.js)

```bash
# From project root
pnpm dev --filter web-admin

# Or navigate directly
cd apps/web-admin
pnpm dev

# Frontend runs on http://localhost:3000
```

**Environment** (`.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Step 4: Run API Server (Fastify) - Optional

```bash
# If using Node.js backend instead of/alongside Core API
pnpm dev --filter api-server

# Runs on http://localhost:3001
```

### Development Workflow Tips

| Task                        | Command                                                   |
| --------------------------- | --------------------------------------------------------- |
| Start everything via Docker | `docker-compose up -d`                                    |
| Start infra only            | `docker-compose up -d postgres redis`                     |
| Run Core API locally        | `cd services/core-api && mvn spring-boot:run`             |
| Run frontend locally        | `pnpm dev --filter web-admin`                             |
| View logs                   | `docker-compose logs -f [service]`                        |
| Reset database              | `docker-compose down -v && docker-compose up -d postgres` |
| Rebuild one container       | `docker-compose up -d --build core-api`                   |

### Hot Reload

- **Core API**: Spring Boot DevTools auto-restarts on class changes
- **Frontend**: Next.js Fast Refresh updates on file save
- **Fastify API**: Uses `tsx watch` for auto-restart

### Troubleshooting

| Issue                | Solution                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Port already in use  | Kill process: `lsof -ti:8080 \| xargs kill` (Mac/Linux) or `netstat -ano \| findstr :8080` (Windows) |
| DB connection failed | Ensure PostgreSQL container is running: `docker ps`                                                  |
| CORS errors          | Check `CORS_ORIGIN` in backend matches frontend URL                                                  |
| Actuator health DOWN | Normal if DB/Redis still starting; endpoints still work                                              |

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint             | Description                      |
| ------ | -------------------- | -------------------------------- |
| POST   | `/api/auth/register` | Register new tenant & admin user |
| POST   | `/api/auth/login`    | Login and receive tokens         |
| POST   | `/api/auth/refresh`  | Refresh access token             |
| POST   | `/api/auth/logout`   | Invalidate refresh token         |
| GET    | `/api/auth/me`       | Get current user profile         |

### Machines

| Method | Endpoint            | Description                   |
| ------ | ------------------- | ----------------------------- |
| GET    | `/api/machines`     | List machines (tenant-scoped) |
| GET    | `/api/machines/:id` | Get machine details           |
| POST   | `/api/machines`     | Create new machine            |
| PATCH  | `/api/machines/:id` | Update machine                |
| DELETE | `/api/machines/:id` | Delete machine                |

### Simulation (Development)

| Method | Endpoint                               | Description      |
| ------ | -------------------------------------- | ---------------- |
| POST   | `/api/simulation/machine/:id/start`    | Start wash cycle |
| POST   | `/api/simulation/machine/:id/complete` | Complete cycle   |
| POST   | `/api/simulation/machine/:id/error`    | Simulate error   |

## 🔌 Real-Time Events

### Socket.io Events

```typescript
// Client → Server
socket.emit("join:tenant", { tenantId });
socket.emit("subscribe:machine", { machineId });

// Server → Client
socket.on("machine:status", { machineId, status, progress });
socket.on("machine:error", { machineId, errorCode, message });
socket.on("cycle:complete", { machineId, cycleId, duration });
```

## 🧪 Testing

### Unit Tests

```bash
pnpm test
```

### Integration Tests (Testcontainers)

Integration tests use real PostgreSQL databases via Testcontainers - no mocks!

```bash
# Requires Docker to be running
pnpm test:int
```

Tests cover:

- ✅ User registration and login
- ✅ Token rotation and refresh
- ✅ IDOR protection (cross-tenant access blocked)
- ✅ Machine CRUD operations
- ✅ Multi-tenant data isolation

## 🐳 Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📊 Database Schema

```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  users     User[]
  machines  Machine[]
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  role          UserRole @default(STAFF)
  tenant        Tenant   @relation(...)
  refreshTokens RefreshToken[]
}

model Machine {
  id        String        @id @default(cuid())
  name      String
  status    MachineStatus @default(IDLE)
  tenant    Tenant        @relation(...)
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  familyId  String   // For theft detection
  user      User     @relation(...)
}
```

## 🌐 Environment Variables

| Variable              | Description                  | Default               |
| --------------------- | ---------------------------- | --------------------- |
| `DATABASE_URL`        | PostgreSQL connection string | -                     |
| `REDIS_URL`           | Redis connection string      | -                     |
| `JWT_ACCESS_SECRET`   | Secret for access tokens     | -                     |
| `JWT_REFRESH_SECRET`  | Secret for refresh tokens    | -                     |
| `PORT`                | API server port              | 3001                  |
| `CORS_ORIGIN`         | Allowed CORS origin          | http://localhost:3000 |
| `NEXT_PUBLIC_API_URL` | API URL for frontend         | http://localhost:3001 |

## 📝 Demo Credentials

After running `pnpm db:seed`:

```
Email: admin@cleanwave.example
Password: password123
Tenant: CleanWave Laundromat
```

---

## 🎯 Roadmap

### Phase 1: MVP Foundation (Q1 2025) ✅

- Multi-tenant architecture
- User authentication & RBAC
- Machine management & booking
- Basic AI chatbot

### Phase 2: Production Ready (Q2 2025)

- Mobile apps (iOS/Android)
- Payment integration (PromptPay, Cards)
- Enhanced IoT dashboard
- Push notifications

### Phase 3: Scale & Intelligence (Q3 2025)

- Demand forecasting AI
- Dynamic pricing engine
- Multi-region deployment
- Advanced analytics

### Phase 4: AI Platform (Q4 2025)

- Autonomous AI agents
- Voice assistant
- Predictive maintenance
- Computer vision

See [08-ROADMAP.md](docs/08-ROADMAP.md) for detailed timeline.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for the modern laundromat industry**

[⬆ Back to Top](#washwise---smart-laundromat-management-platform)

</div>
