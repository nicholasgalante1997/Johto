# Docker Deployment

The cron service is containerized with Docker for consistent deployment across environments.

## Dockerfile Overview

The service uses a multi-stage build for optimal image size:

```dockerfile
# Stage 1: Builder
FROM oven/bun:1.3.5-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source and type-check
COPY . .
RUN bun run typecheck

# Stage 2: Production
FROM oven/bun:1.3.5-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S cron && \
    adduser -S cron -u 1001 -G cron

# Create directories
RUN mkdir -p /app/database/backups && \
    chown -R cron:cron /app

# Copy built app
COPY --from=builder --chown=cron:cron /app .

# Switch to non-root user
USER cron

# Environment defaults
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/database/pokemon-data.sqlite3.db
ENV BACKUP_DIR=/app/database/backups
ENV CRON_LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ["bun", "run", "src/cli.ts", "status"]

# Start scheduler
CMD ["bun", "run", "src/index.ts"]
```

## Building the Image

### Local Build

```bash
# Build from the cron directory
cd apps/cron
docker build -t pokemon-cron .

# Build with specific tag
docker build -t pokemon-cron:v1.0.0 .

# Build with build args
docker build \
  --build-arg BUN_VERSION=1.3.5 \
  -t pokemon-cron .
```

### From Monorepo Root

```bash
# Build with context
docker build -t pokemon-cron -f apps/cron/Dockerfile apps/cron
```

## Running the Container

### Basic Run

```bash
docker run -d \
  --name pokemon-cron \
  pokemon-cron
```

### With Volume Mounts

```bash
docker run -d \
  --name pokemon-cron \
  -v $(pwd)/database:/app/database \
  pokemon-cron
```

### With Environment Variables

```bash
docker run -d \
  --name pokemon-cron \
  -v $(pwd)/database:/app/database \
  -e CRON_LOG_LEVEL=debug \
  -e CRON_TIMEZONE=UTC \
  -e POSTGRES_HOST=postgres \
  -e POSTGRES_USER=pokemon \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=pokemon_tcg \
  -e NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/... \
  pokemon-cron
```

### With Environment File

```bash
docker run -d \
  --name pokemon-cron \
  -v $(pwd)/database:/app/database \
  --env-file .env \
  pokemon-cron
```

## Docker Compose

### Standalone Service

```yaml
# docker-compose.yml
services:
  cron:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: pokemon-cron
    restart: unless-stopped
    volumes:
      - ./database:/app/database
    environment:
      - CRON_LOG_LEVEL=info
      - CRON_TIMEZONE=America/New_York
    healthcheck:
      test: ['CMD', 'bun', 'run', 'src/cli.ts', 'status']
      interval: 30s
      timeout: 10s
      retries: 3
```

### Full Stack with Dependencies

```yaml
# docker-compose.yml
services:
  cron:
    build:
      context: ./apps/cron
      dockerfile: Dockerfile
    container_name: pokemon-cron
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - cron-data:/app/database
    environment:
      - CRON_LOG_LEVEL=info
      - POSTGRES_HOST=postgres
      - POSTGRES_USER=pokemon
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=pokemon_tcg
      - NOTIFICATION_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
    networks:
      - pokemon-network

  postgres:
    image: postgres:16-alpine
    container_name: pokemon-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=pokemon
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=pokemon_tcg
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U pokemon']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pokemon-network

volumes:
  cron-data:
  postgres-data:

networks:
  pokemon-network:
    driver: bridge
```

### Start Services

```bash
# Start all services
docker compose up -d

# Start only cron
docker compose up -d cron

# View logs
docker compose logs -f cron

# Stop services
docker compose down
```

## Volume Management

### Required Volumes

| Path            | Purpose                     | Persistence |
| --------------- | --------------------------- | ----------- |
| `/app/database` | SQLite database and backups | Required    |

### Volume Commands

```bash
# Create named volume
docker volume create pokemon-cron-data

# Use named volume
docker run -d \
  -v pokemon-cron-data:/app/database \
  pokemon-cron

# Backup volume data
docker run --rm \
  -v pokemon-cron-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/cron-data-backup.tar.gz -C /data .

# Restore volume data
docker run --rm \
  -v pokemon-cron-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/cron-data-backup.tar.gz -C /data
```

## Health Checks

The container includes a health check that runs the CLI status command:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' pokemon-cron

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' pokemon-cron
```

### Health Check Configuration

```dockerfile
HEALTHCHECK \
  --interval=30s \      # Check every 30 seconds
  --timeout=10s \       # Fail if takes longer than 10s
  --start-period=5s \   # Grace period for startup
  --retries=3 \         # Mark unhealthy after 3 failures
  CMD ["bun", "run", "src/cli.ts", "status"]
```

## Logging

### View Logs

```bash
# Follow logs
docker logs -f pokemon-cron

# Last 100 lines
docker logs --tail 100 pokemon-cron

# With timestamps
docker logs -t pokemon-cron
```

### Log Drivers

```yaml
# docker-compose.yml
services:
  cron:
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'
```

## Networking

### Connecting to Other Services

```bash
# Create network
docker network create pokemon-network

# Run with network
docker run -d \
  --name pokemon-cron \
  --network pokemon-network \
  -e POSTGRES_HOST=postgres \
  pokemon-cron
```

### DNS Resolution

In Docker Compose, service names resolve automatically:

- `postgres` resolves to the PostgreSQL container
- `neo4j` resolves to the Neo4j container

## Security Considerations

### Non-Root User

The container runs as a non-root user (`cron:1001`):

```dockerfile
RUN addgroup -g 1001 -S cron && \
    adduser -S cron -u 1001 -G cron
USER cron
```

### Read-Only Filesystem

For extra security, run with read-only root:

```bash
docker run -d \
  --name pokemon-cron \
  --read-only \
  -v $(pwd)/database:/app/database \
  --tmpfs /tmp \
  pokemon-cron
```

### Secrets Management

Use Docker secrets or environment files:

```bash
# Using secrets (Docker Swarm)
echo "my-webhook-url" | docker secret create slack_webhook -

# Reference in compose
services:
  cron:
    secrets:
      - slack_webhook
    environment:
      - NOTIFICATION_WEBHOOK_URL_FILE=/run/secrets/slack_webhook
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker logs pokemon-cron

# Run interactively
docker run -it --rm pokemon-cron /bin/sh

# Check file permissions
docker run -it --rm \
  -v $(pwd)/database:/app/database \
  pokemon-cron ls -la /app/database
```

### Database Connection Issues

```bash
# Test connectivity
docker exec pokemon-cron bun run job:run database-health-check

# Check environment
docker exec pokemon-cron env | grep POSTGRES
```

### Permission Errors

```bash
# Fix volume permissions
sudo chown -R 1001:1001 ./database

# Or run with matching UID
docker run -d \
  --user $(id -u):$(id -g) \
  -v $(pwd)/database:/app/database \
  pokemon-cron
```

## Production Checklist

- [ ] Use specific image tags, not `latest`
- [ ] Set resource limits (CPU/memory)
- [ ] Configure health checks
- [ ] Use named volumes for persistence
- [ ] Set up log rotation
- [ ] Configure restart policy
- [ ] Use secrets for sensitive data
- [ ] Run as non-root user
- [ ] Set up monitoring and alerts
