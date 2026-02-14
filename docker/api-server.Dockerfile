# WashWise API Server Dockerfile
# Multi-stage build for Node.js 22

# Stage 1: Build
FROM node:25-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY turbo.json ./

# Copy packages
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/

# Copy api-server
COPY apps/api-server/package.json ./apps/api-server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/types ./packages/types
COPY packages/config ./packages/config
COPY packages/database ./packages/database
COPY apps/api-server ./apps/api-server

# Generate Prisma client
RUN pnpm --filter @washwise/database generate

# Build all packages
RUN pnpm turbo build --filter=@washwise/api-server...

# Stage 2: Production
FROM node:25-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 washwise

# Copy built artifacts
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/types/dist ./packages/types/dist

COPY --from=builder /app/packages/config/package.json ./packages/config/
COPY --from=builder /app/packages/config/dist ./packages/config/dist

COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/node_modules/.prisma ./packages/database/node_modules/.prisma

COPY --from=builder /app/apps/api-server/package.json ./apps/api-server/
COPY --from=builder /app/apps/api-server/dist ./apps/api-server/dist
COPY --from=builder /app/apps/api-server/node_modules ./apps/api-server/node_modules

USER washwise

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# Run migrations and start
CMD ["sh", "-c", "cd packages/database && npx prisma migrate deploy && cd ../../apps/api-server && node dist/index.js"]
