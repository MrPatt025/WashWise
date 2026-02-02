# WashWise Web Admin Dockerfile
# Multi-stage build for Next.js 15

# Stage 1: Dependencies
FROM node:22-alpine AS deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/types/package.json ./packages/types/
COPY apps/web-admin/package.json ./apps/web-admin/

RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/apps/web-admin/node_modules ./apps/web-admin/node_modules

COPY pnpm-workspace.yaml package.json turbo.json ./
COPY packages/types ./packages/types
COPY apps/web-admin ./apps/web-admin

# Build types first, then web-admin
RUN pnpm turbo build --filter=@washwise/web-admin...

# Stage 3: Production
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web-admin/public ./apps/web-admin/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-admin/.next/static ./apps/web-admin/.next/static

USER nextjs

# Health check runs as non-root user for security
# NOSONAR - S7031: Intentionally placed after USER for least-privilege principle
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web-admin/server.js"]
