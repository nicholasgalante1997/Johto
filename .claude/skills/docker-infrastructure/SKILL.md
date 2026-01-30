---
name: docker-infrastructure
description: Docker and docker-compose patterns for multi-service Pokemon TCG platform with PostgreSQL, Neo4j, Rust API, and React frontend.
tags:
  - docker
  - docker-compose
  - infrastructure
  - deployment
---

# Docker Infrastructure Patterns

## Purpose

Define patterns for containerized deployment of Pokemon TCG platform services including web frontend, Rust API, PostgreSQL, and Neo4j.

## Priority

**High**

## Service Architecture

### Docker Compose Structure

**ALWAYS** organize services by concern (ID: SERVICE_ORGANIZATION)

```yaml
# docker-compose.yml
include:
  - ./docker/database/docker-compose.yml
  - ./apps/tcg-api/docker-compose.yml
  - ./docker-compose.web.yml

networks:
  pika:
    driver: bridge
```

### Database Services

**ALWAYS** configure persistent volumes (ID: PERSISTENT_VOLUMES)

```yaml
# docker/database/docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    container_name: pokemon-postgres
    environment:
      POSTGRES_DB: pokemon_tcg
      POSTGRES_USER: ${POSTGRES_USER:-pokemon}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - pika
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U pokemon']
      interval: 10s
      timeout: 5s
      retries: 5

  neo4j:
    image: neo4j:5.15-community
    container_name: pokemon-neo4j
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD:-password}
      NEO4J_PLUGINS: '["apoc"]'
    ports:
      - '7474:7474' # HTTP
      - '7687:7687' # Bolt
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
    networks:
      - pika
    healthcheck:
      test:
        [
          'CMD-SHELL',
          'wget --no-verbose --tries=1 --spider localhost:7474 || exit 1'
        ]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  neo4j_data:
  neo4j_logs:

networks:
  pika:
    external: true
```

### API Service

**ALWAYS** use multi-stage builds for Rust (ID: MULTI_STAGE_RUST)

```dockerfile
# apps/tcg-api/Dockerfile
FROM rust:1.75-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache musl-dev openssl-dev

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Build dependencies (cached layer)
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy source code
COPY src ./src

# Build application
RUN cargo build --release

# Runtime stage
FROM alpine:3.19

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache libgcc openssl

# Copy binary from builder
COPY --from=builder /app/target/release/tcg-api ./tcg-api

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./tcg-api"]
```

**ALWAYS** configure service with health checks (ID: API_HEALTH_CHECK)

```yaml
# apps/tcg-api/docker-compose.yml
services:
  tcg-api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: pokemon-api
    environment:
      DATABASE_URL: postgresql://pokemon:password@postgres:5432/pokemon_tcg
      NEO4J_URI: bolt://neo4j:7687
      NEO4J_USER: neo4j
      NEO4J_PASSWORD: ${NEO4J_PASSWORD:-password}
      RUST_LOG: info
    ports:
      - '8080:8080'
    depends_on:
      postgres:
        condition: service_healthy
      neo4j:
        condition: service_healthy
    networks:
      - pika
    healthcheck:
      test:
        [
          'CMD-SHELL',
          'wget --no-verbose --tries=1 --spider localhost:8080/health || exit 1'
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Web Frontend Service

**ALWAYS** use multi-stage builds for Node/Bun (ID: MULTI_STAGE_BUN)

```dockerfile
# docker/web/Dockerfile
FROM oven/bun:1.3.5-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json bun.lockb ./
COPY apps/web/package.json ./apps/web/
COPY packages ./packages

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY apps/web ./apps/web

# Build application
WORKDIR /app/apps/web
RUN bun run build

# Runtime stage
FROM oven/bun:1.3.5-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/web/dist ./dist
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Start server
CMD ["bun", "run", "start"]
```

**ALWAYS** configure web service properly (ID: WEB_SERVICE_CONFIG)

```yaml
# docker-compose.web.yml
services:
  web:
    build:
      context: .
      dockerfile: ./docker/web/Dockerfile
    container_name: pokemon-web
    environment:
      NODE_ENV: production
      API_URL: http://tcg-api:8080
      PORT: 3000
    ports:
      - '3000:3000'
    depends_on:
      tcg-api:
        condition: service_healthy
    networks:
      - pika
    healthcheck:
      test:
        [
          'CMD-SHELL',
          'wget --no-verbose --tries=1 --spider localhost:3000 || exit 1'
        ]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Development Workflow

### Development Compose Override

**ALWAYS** provide development override (ID: DEV_OVERRIDE)

```yaml
# docker-compose.dev.yml
services:
  web:
    build:
      target: development
    environment:
      NODE_ENV: development
    volumes:
      - ./apps/web/src:/app/apps/web/src:ro
      - ./apps/web/public:/app/apps/web/public:ro
    command: bun run dev

  tcg-api:
    environment:
      RUST_LOG: debug
    volumes:
      - ./apps/tcg-api/src:/app/src:ro
    command: cargo watch -x run
```

### Starting Services

**ALWAYS** provide convenience scripts (ID: CONVENIENCE_SCRIPTS)

```bash
#!/bin/bash
# bin/docker/up

echo "Starting Pokemon TCG Platform..."

# Create network if it doesn't exist
docker network create pika 2>/dev/null || true

# Start all services
docker compose up -d

echo "Services started successfully!"
echo "Web: http://localhost:3000"
echo "API: http://localhost:8080"
echo "Neo4j Browser: http://localhost:7474"
```

```bash
#!/bin/bash
# bin/docker/down

echo "Stopping Pokemon TCG Platform..."

docker compose down

echo "Services stopped successfully!"
```

```bash
#!/bin/bash
# bin/docker/down-vols

echo "Stopping Pokemon TCG Platform and removing volumes..."

docker compose down -v

echo "Services stopped and volumes removed!"
```

### Database Initialization

**ALWAYS** provide init scripts (ID: DB_INIT_SCRIPTS)

```sql
-- docker/database/init.sql
CREATE TABLE IF NOT EXISTS sets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    series VARCHAR(100),
    total_cards INTEGER,
    release_date DATE,
    standard_legal BOOLEAN DEFAULT false,
    expanded_legal BOOLEAN DEFAULT false,
    unlimited_legal BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pokemon_cards (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hp VARCHAR(10),
    types TEXT[],
    supertype VARCHAR(50) NOT NULL,
    subtypes TEXT[],
    set_id VARCHAR(50) REFERENCES sets(id),
    number VARCHAR(20),
    rarity VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cards_name ON pokemon_cards(name);
CREATE INDEX idx_cards_set_id ON pokemon_cards(set_id);
CREATE INDEX idx_cards_types ON pokemon_cards USING GIN(types);
```

### Data Seeding

**ALWAYS** provide seeding service (ID: SEED_SERVICE)

```yaml
# docker-compose.yml
services:
  seed:
    build:
      context: .
      dockerfile: Dockerfile.seed
    container_name: pokemon-seed
    environment:
      DATABASE_URL: postgresql://pokemon:password@postgres:5432/pokemon_tcg
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - pika
    profiles:
      - seed
```

```dockerfile
# Dockerfile.seed
FROM oven/bun:1.3.5-alpine

WORKDIR /app

COPY package.json bun.lockb ./
COPY apps/scripts ./apps/scripts
COPY packages/@pokemon-data ./packages/@pokemon-data

RUN bun install

CMD ["bun", "run", "apps/scripts/lib/database/sync.js"]
```

```bash
# Seed database
docker compose --profile seed up seed
```

## Production Deployment

### Production Compose

**ALWAYS** optimize for production (ID: PRODUCTION_OPTIMIZED)

```yaml
# docker-compose.prod.yml
services:
  web:
    image: pokemon-web:latest
    restart: unless-stopped
    environment:
      NODE_ENV: production
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  tcg-api:
    image: pokemon-api:latest
    restart: unless-stopped
    environment:
      RUST_LOG: warn
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M

  postgres:
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  neo4j:
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### Environment Variables

**ALWAYS** use .env files (ID: ENV_FILES)

```bash
# .env.example
# PostgreSQL
POSTGRES_USER=pokemon
POSTGRES_PASSWORD=changeme
POSTGRES_DB=pokemon_tcg

# Neo4j
NEO4J_PASSWORD=changeme

# API
DATABASE_URL=postgresql://pokemon:changeme@postgres:5432/pokemon_tcg
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
RUST_LOG=info

# Web
NODE_ENV=production
API_URL=http://tcg-api:8080
```

### Logging

**ALWAYS** configure centralized logging (ID: CENTRALIZED_LOGGING)

```yaml
services:
  web:
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  tcg-api:
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'
```

## Monitoring & Health

### Health Checks

**ALWAYS** implement health check endpoints (ID: HEALTH_ENDPOINTS)

```rust
// Rust API health check
#[get("/health")]
async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}
```

```typescript
// Web frontend health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});
```

## Backup & Recovery

### Database Backups

**ALWAYS** provide backup scripts (ID: BACKUP_SCRIPTS)

```bash
#!/bin/bash
# bin/docker/backup-db

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec pokemon-postgres pg_dump -U pokemon pokemon_tcg > \
  "$BACKUP_DIR/postgres_$TIMESTAMP.sql"

# Backup Neo4j
docker exec pokemon-neo4j neo4j-admin dump --to=/tmp/neo4j_backup.dump
docker cp pokemon-neo4j:/tmp/neo4j_backup.dump \
  "$BACKUP_DIR/neo4j_$TIMESTAMP.dump"

echo "Backups created successfully!"
```

## Best Practices

- Always use health checks for service dependencies
- Configure resource limits for production
- Use secrets management for sensitive data
- Enable logging for all services
- Implement graceful shutdown
- Use multi-stage builds to minimize image size
- Version Docker images properly
- Document all environment variables
- Test backup and restore procedures
- Monitor container metrics
