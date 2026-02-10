# Pokemon TCG Cron Service
# Multi-stage Bun build for minimal image size

# Build stage
FROM oven/bun:1.3.5-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock* ./
COPY turbo.json ./

# Copy all packages (needed for workspace resolution)
COPY packages ./packages

# Copy cron app
COPY apps/cron ./apps/cron

# Install dependencies
RUN bun install --frozen-lockfile

# Build (if needed)
WORKDIR /app/apps/cron
RUN bun run check-types

# Production stage
FROM oven/bun:1.3.5-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -S cron && adduser -S cron -G cron

# Copy workspace dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/cron ./apps/cron

# Create directories for data and backups
RUN mkdir -p /app/database/backups && \
    chown -R cron:cron /app/database

WORKDIR /app/apps/cron

# Set environment defaults
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/database/pokemon-data.sqlite3.db
ENV BACKUP_DIR=/app/database/backups
ENV CRON_LOG_LEVEL=info

# Switch to non-root user
USER cron

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=5s \
  CMD bun run src/cli.ts status || exit 1

# Expose port for health endpoint (future)
EXPOSE 3001

# Start the cron service
CMD ["bun", "run", "start"]
