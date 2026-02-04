# WashWise AI Coding Instructions

## Project Overview

WashWise is an enterprise multi-tenant SaaS platform for smart laundromat management. It uses an
**asynchronous microservices architecture** with:

- **api-server** (Node.js/Fastify): REST API with dual-token auth, tenant isolation
- **web-admin** (Next.js 16/React 19): Dashboard using App Router, TanStack Query, Zustand
- **ai-worker** (Python/FastAPI): AI chatbot service communicating via Redis Streams
- **core-api** (Java/Spring Boot): Future business logic service
- **database** (Prisma/PostgreSQL): Shared schema with multi-tenant row-level isolation

## Critical Architecture Patterns

### Multi-Tenant Security (MANDATORY)

Every database query MUST include `tenantId` filter from JWT context:

```typescript
// ✅ CORRECT - Always filter by tenantId from request context
const machines = await prisma.machine.findMany({
  where: { tenantId: request.user!.tenantId, ...filters },
});

// ❌ WRONG - Never query without tenant isolation
const machines = await prisma.machine.findMany({ where: filters });
```

Return 404 (not 403) for cross-tenant access attempts to prevent IDOR enumeration.

### Dual-Token Authentication

- **Access Token**: 15min, stored in memory only (Zustand store), sent via `Authorization: Bearer`
- **Refresh Token**: 7 days, HttpOnly cookie (`washwise_refresh_token`), auto-rotates on each
  refresh
- Token family tracking detects theft - if reused token detected, invalidate entire family

### Zod Schema Sharing Pattern

Schemas are defined in `packages/types/src/schemas/` and shared across frontend/backend:

```typescript
// Define once in @washwise/types
export const CreateMachineSchema = z.object({ ... });
export type CreateMachine = z.infer<typeof CreateMachineSchema>;

// Use in API route (api-server)
const data = CreateMachineSchema.parse(request.body);

// Validate API response (web-admin)
return validateResponse(AuthResponseSchema, response.data, endpoint);
```

## Developer Workflows

### Quick Start

```bash
pnpm install                    # Install all dependencies
docker-compose up -d            # Start PostgreSQL + Redis
pnpm db:generate && pnpm db:migrate  # Setup database
pnpm dev                        # Start all services via Turborepo
```

### Database Changes

1. Edit `packages/database/prisma/schema.prisma`
2. Run `pnpm db:migrate` (creates migration + generates client)
3. Import from `@washwise/database`: `import { prisma, type Machine } from "@washwise/database"`

### Testing Strategy

- **Unit tests**: `pnpm test` (Vitest) - mock external deps
- **Integration tests**: `pnpm test:integration` - uses Testcontainers for real PostgreSQL
- **E2E tests**: `pnpm test:e2e` (Playwright) - full stack tests in `e2e/tests/`

Integration tests MUST use Testcontainers, not mocks:

```typescript
container = await new PostgreSqlContainer("postgres:17-alpine").start();
```

## Key Files Reference

| Purpose       | Location                                     |
| ------------- | -------------------------------------------- |
| Prisma schema | `packages/database/prisma/schema.prisma`     |
| Zod schemas   | `packages/types/src/schemas/*.schema.ts`     |
| API routes    | `apps/api-server/src/routes/*.routes.ts`     |
| Auth plugin   | `apps/api-server/src/plugins/auth.plugin.ts` |
| React hooks   | `apps/web-admin/src/hooks/use-*.ts`          |
| Auth store    | `apps/web-admin/src/stores/auth.store.ts`    |
| AI routes     | `services/ai-worker/app/routes/*.py`         |

## Conventions

### Commit Messages

Use Conventional Commits with scopes: `feat(api-server):`, `fix(web-admin):`, `docs:`,
`refactor(database):`

### File Naming

- TypeScript: `kebab-case` (e.g., `auth.service.ts`, `use-machines.ts`)
- React components: `PascalCase` for component files in `components/`
- Prisma models: `PascalCase` with `@@map("snake_case")` table names

### API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}
```

### Socket Events

Real-time updates use Socket.io with tenant-scoped rooms:

```typescript
// Events defined in @washwise/types
socket.emit(SOCKET_EVENTS.JOIN_TENANT_ROOM, tenantId);
socket.on(SOCKET_EVENTS.MACHINE_UPDATE, handler);
```

## Inter-Service Communication

- **Core API ↔ AI Worker**: Redis Streams for async messaging
- **Frontend ↔ API**: REST + Socket.io for real-time
- AI Worker requires `X-Tenant-Id` and `X-User-Id` headers for all requests
