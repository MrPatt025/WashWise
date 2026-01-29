# WashWise - Smart Laundromat Management Platform

A production-ready, multi-tenant SaaS platform for smart laundromat management with real-time IoT capabilities.

## 🏗 Architecture

### Tech Stack (2026 Standards)

| Layer | Technology |
|-------|-----------|
| **Monorepo** | Turborepo v2 + pnpm v9 |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript 5.7+ |
| **State** | TanStack Query v5 (Server), Zustand v5 (Client) |
| **UI** | Tailwind CSS v4, Shadcn UI, Lucide React |
| **Backend** | Node.js 22 LTS, Fastify v5 |
| **Validation** | Zod v3.24 |
| **Real-time** | Socket.io v4 + Redis 7 |
| **Database** | PostgreSQL 17 + Prisma v6 |
| **Testing** | Vitest v3 + Testcontainers |

### Repository Structure

```
washwise/
├── apps/
│   ├── api-server/          # Fastify backend
│   └── web-admin/           # Next.js admin dashboard
├── packages/
│   ├── database/            # Prisma schema & client
│   ├── types/               # Shared Zod schemas & types
│   └── config/              # Shared configuration
├── docker/                  # Docker configurations
└── turbo.json              # Turborepo configuration
```

## 🔐 Security Features

- **Dual-Token Authentication**: Access Token (memory) + Refresh Token (HttpOnly cookie)
- **Token Rotation**: New tokens issued on every refresh
- **Reuse Detection**: Token theft detection via familyId tracking
- **Multi-tenant Isolation**: Row-level security with tenantId
- **IDOR Protection**: 404 responses for cross-tenant access attempts

## 🚀 Getting Started

### Prerequisites

- Node.js 22 LTS
- pnpm 9.x
- Docker & Docker Compose
- PostgreSQL 17 (or use Docker)
- Redis 7 (or use Docker)

### Installation

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# Setup environment variables
cp apps/api-server/.env.example apps/api-server/.env
cp apps/web-admin/.env.example apps/web-admin/.env.local

# Run database migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate

# Start development
pnpm dev
```

## 📝 API Documentation

Swagger documentation available at: `http://localhost:3001/docs`

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run integration tests (requires Docker)
pnpm test:integration
```

## 📄 License

MIT License
