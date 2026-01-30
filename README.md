# WashWise - Smart Laundromat Management Platform

A production-ready, multi-tenant SaaS platform for smart laundromat management with real-time IoT capabilities.

## 🏗 Architecture

### Tech Stack (2026 Standards)

| Layer          | Technology                                         |
| -------------- | -------------------------------------------------- |
| **Monorepo**   | Turborepo v2 + pnpm v9                             |
| **Frontend**   | Next.js 15 (App Router), React 19, TypeScript 5.7+ |
| **State**      | TanStack Query v5 (Server), Zustand v5 (Client)    |
| **UI**         | Tailwind CSS v4, Shadcn UI, Lucide React           |
| **Backend**    | Node.js 22 LTS, Fastify v5                         |
| **Validation** | Zod v3.24                                          |
| **Real-time**  | Socket.io v4 + Redis 7                             |
| **Database**   | PostgreSQL 17 + Prisma v6                          |
| **Testing**    | Vitest v3 + Testcontainers                         |

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
├── docker/                  # Dockerfiles
├── docker-compose.yml       # Development services
└── docker-compose.prod.yml  # Production deployment
```

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

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ using the 2026 tech stack
