FROM oven/bun:1.3.5-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
COPY apps/graphql-api/package.json ./apps/graphql-api/
COPY packages/@clients/package.json ./packages/@clients/
COPY packages/@database/package.json ./packages/@database/
COPY packages/@logger/package.json ./packages/@logger/
COPY packages/@utils/package.json ./packages/@utils/
COPY packages/@configs/package.json ./packages/@configs/
RUN bun install --frozen-lockfile

# Build
FROM deps AS build
COPY packages/ ./packages/
COPY apps/graphql-api/ ./apps/graphql-api/
WORKDIR /app/apps/graphql-api
RUN bun run build

# Production
FROM base AS production
WORKDIR /app

# Copy built artifacts
COPY --from=build /app/apps/graphql-api/dist ./dist
COPY --from=build /app/apps/graphql-api/package.json ./

# Copy required packages
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages

# Create non-root user
USER bun

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Start the server
CMD ["bun", "run", "dist/index.js"]
