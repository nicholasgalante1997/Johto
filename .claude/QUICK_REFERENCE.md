# Claude Code Quick Reference

## Starting Claude Code

```bash
# Default agent
claude

# Specialized agents
claude --agent bun-react-frontend
claude --agent rust-graphql-api

# Resume previous session
claude --resume

# Headless mode
claude -p "Review this code"
```

## Essential Commands (within Claude Code)

| Command             | Purpose                         |
| ------------------- | ------------------------------- |
| `/usage`            | View context window consumption |
| `/compact`          | Summarize conversation history  |
| `/context add file` | Add file to context             |
| `/context show`     | View current context            |
| `/context clear`    | Clear session context           |
| `/help`             | List available commands         |
| `/save name`        | Save conversation               |
| `/load name`        | Load saved conversation         |

## Project Structure

```
.claude/
├── CLAUDE.md              # Project context (auto-loaded)
├── agents/                # Specialized subagents
│   ├── bun-react-frontend.md
│   └── rust-graphql-api.md
├── skills/                # Modular capabilities
│   ├── react-bun-ssr/
│   ├── rust-actix-graphql/
│   ├── pokemon-tcg-data/
│   └── docker-infrastructure/
├── settings.json          # Permissions & hooks
├── README.md             # Documentation
└── QUICK_REFERENCE.md    # This file
```

## Common Tasks

### Create a React Component

```bash
claude --agent bun-react-frontend
# "Create a PokemonCard component that displays card image, name, HP, and types"
```

### Add a GraphQL Endpoint

```bash
claude --agent rust-graphql-api
# "Add a GraphQL query to fetch all cards in a specific set"
```

### Set Up Database

```bash
claude
# "Create PostgreSQL migration for the collections table"
```

### Configure Docker Service

```bash
claude
# "Add Redis cache service to docker-compose.yml"
```

### Add Data Validation

```bash
claude
# "Add validation for Pokemon deck composition rules"
```

## Key Conventions

### React Component Structure

```
PokemonCard/
├── index.ts
├── PokemonCard.tsx       # Component implementation
├── PokemonCard.css       # Scoped styles
├── types.ts              # TypeScript types
└── __tests__/
    └── PokemonCard.test.tsx
```

### Rust Module Structure

```
feature/
├── mod.rs                # Module exports
├── models.rs             # Data models
├── handlers.rs           # Request handlers
├── schema.rs             # GraphQL schema
└── tests.rs              # Unit tests
```

### GraphQL Query Pattern

```rust
#[Object]
impl QueryRoot {
    async fn cards(&self, ctx: &Context<'_>, set_id: String) -> Result<Vec<PokemonCard>> {
        let pool = ctx.data::<PgPool>()?;
        Ok(PokemonCard::find_by_set(pool, &set_id).await?)
    }
}
```

### React SSR Pattern

```typescript
// Server-side
import { renderToString } from 'react-dom/server';
const html = renderToString(<App />);

// Client-side
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root')!, <App />);
```

## Critical Requirements

### Frontend (React + Bun)

- **ALWAYS** use React 19 canary features
- **ALWAYS** implement SSR for pages
- **ALWAYS** use Bun native APIs when possible
- **NEVER** import Node.js-specific modules in browser code
- **ALWAYS** handle hydration errors

### Backend (Rust + GraphQL)

- **ALWAYS** use async/await patterns
- **ALWAYS** parameterize database queries
- **ALWAYS** use transactions for multi-step operations
- **NEVER** use unwrap() in production code
- **ALWAYS** implement proper error handling

### Pokemon TCG Data

- **ALWAYS** validate card data before insertion
- **ALWAYS** enforce deck composition rules (60 cards, max 4 copies)
- **ALWAYS** check format legality
- **ALWAYS** handle missing optional fields

### Docker Infrastructure

- **ALWAYS** use health checks for dependencies
- **ALWAYS** configure persistent volumes
- **ALWAYS** use multi-stage builds
- **ALWAYS** set resource limits for production

## Permissions

Default permissions:

- ✅ Read: Source files, configs, markdown, Rust, TypeScript
- ✅ Write: Source code in apps/ and packages/
- ✅ Bash: bun, cargo, docker, git log
- ❌ Deny: .env files, node_modules, target/, dangerous commands

Modify in `.claude/settings.json`

## Agents

| Agent              | Best For                              | Skills                               |
| ------------------ | ------------------------------------- | ------------------------------------ |
| bun-react-frontend | React development, UI components      | react-bun-ssr, pokemon-tcg-data      |
| rust-graphql-api   | API development, database ops         | rust-actix-graphql, pokemon-tcg-data |
| default            | Infrastructure, Docker, general tasks | All capabilities                     |

## Skills (Auto-Loading)

| Skill                 | Activates For                          |
| --------------------- | -------------------------------------- |
| react-bun-ssr         | React components, SSR, Bun runtime     |
| rust-actix-graphql    | Rust API, GraphQL, database operations |
| pokemon-tcg-data      | Card data, validation, TCG rules       |
| docker-infrastructure | Docker, compose, deployment            |

## Development Commands

### Frontend (Bun + React)

```bash
cd apps/web

bun run dev              # Dev server with HMR
bun run build            # Production build
bun run start            # Start production server
bun run storybook        # Launch Storybook
bun test                 # Run tests
bun run check-types      # TypeScript check
```

### Backend (Rust + GraphQL)

```bash
cd apps/tcg-api

cargo run                # Start API server
cargo watch -x run       # Auto-reload
cargo test               # Run tests
cargo build --release    # Production build
cargo clippy             # Linting
cargo fmt                # Format code

sqlx migrate run         # Run migrations
sqlx migrate revert      # Revert migration
```

### Docker Commands

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Stop services
docker compose down

# Remove volumes
docker compose down -v

# View logs
docker compose logs -f

# Specific service
docker compose up postgres neo4j
```

### Turborepo Commands

```bash
# Root commands
bun run dev              # Start all apps
bun run build            # Build all apps
bun run test             # Test all apps
bun run lint             # Lint all code
bun run format           # Format all code
bun run check-types      # Type check all

# Specific workspace
bun run --filter @pokemon/web dev
```

## Database Operations

### PostgreSQL

```bash
# Connect to database
docker exec -it pokemon-postgres psql -U pokemon -d pokemon_tcg

# Run migration
cd apps/tcg-api
sqlx migrate run

# Create migration
sqlx migrate add create_cards_table

# Backup database
docker exec pokemon-postgres pg_dump -U pokemon pokemon_tcg > backup.sql
```

### Neo4j

```bash
# Access Neo4j browser
open http://localhost:7474

# Backup Neo4j
docker exec pokemon-neo4j neo4j-admin dump --to=/tmp/backup.dump
```

### Sync Pokemon Data

```bash
# Sync all card data
bun run json:sync

# Seed database with Docker
docker compose --profile seed up seed
```

## Troubleshooting

### Frontend Issues

- **Hydration errors**: Ensure server/client renders match
- **Bun errors**: Check Bun version (1.3.5)
- **Build fails**: Clear dist/ and node_modules/, reinstall

### Backend Issues

- **Database connection**: Check DATABASE_URL env var
- **Compile errors**: Run `cargo clean && cargo build`
- **Migration fails**: Check migration order and rollback

### Docker Issues

- **Service won't start**: Check `docker compose logs <service>`
- **Port conflicts**: Change port mapping in docker-compose.yml
- **Volume issues**: Remove volumes with `docker compose down -v`

### Context Issues

- Use `/usage` to check consumption
- Use `/compact` to summarize history
- Use `/context clear` to reset

## Tips & Tricks

1. **Use `/compact`** in long sessions to reduce context
2. **Check `/usage`** regularly to stay aware
3. **Save conversations** with `/save` for reference
4. **Use headless mode** for automation and CI/CD
5. **Leverage skills** - they activate automatically
6. **Review CLAUDE.md** for project context
7. **Check agents** for specialized expertise
8. **Use Docker** for consistent environments

## Quick Links

- **Project README**: ../README.md
- **Full Documentation**: ./README.md
- **Project Context**: ./CLAUDE.md
- **Claude Code Docs**: https://docs.claude.com/claude-code

## Environment Setup

### Required Environment Variables

**Frontend (.env):**

```
API_URL=http://localhost:8080
NODE_ENV=development
```

**Backend (.env):**

```
DATABASE_URL=postgresql://pokemon:password@localhost:5432/pokemon_tcg
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
RUST_LOG=info
```

## Service URLs

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8080
- **GraphQL Playground**: http://localhost:8080/graphql
- **Neo4j Browser**: http://localhost:7474
- **PostgreSQL**: localhost:5432
- **Storybook**: http://localhost:6006

## Getting Help

1. Use `/help` in Claude Code
2. Check `.claude/README.md`
3. Review `.claude/CLAUDE.md`
4. Consult skill documentation in `.claude/skills/`
5. Check Claude Code docs online
