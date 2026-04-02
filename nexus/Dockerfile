# ============================================================
# Nexus v1 — Production Dockerfile
# Multi-stage build: install → build → runtime
# ============================================================

# --- Stage 1: Install dependencies ---
FROM node:22-slim AS deps

WORKDIR /app
RUN npm install -g pnpm@10

# Copy workspace root configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy package.json for each package (layer cache)
COPY packages/core/package.json packages/core/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/sdk/package.json packages/sdk/package.json

RUN pnpm install --frozen-lockfile

# --- Stage 2: Build ---
FROM deps AS build

# Copy source
COPY packages/ packages/
COPY supabase/ supabase/

RUN npx turbo build

# --- Stage 3: Runtime ---
FROM node:22-slim AS runtime

WORKDIR /app
RUN npm install -g pnpm@10

# Copy workspace configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/sdk/package.json packages/sdk/package.json

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built output
COPY --from=build /app/packages/core/dist packages/core/dist
COPY --from=build /app/packages/server/dist packages/server/dist
COPY --from=build /app/packages/sdk/dist packages/sdk/dist

# Copy migrations (needed at startup)
COPY --from=build /app/supabase/migrations supabase/migrations

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "packages/server/dist/index.js"]
