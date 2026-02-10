# Claude Code Configuration

This directory contains Claude Code CLI configuration for Project Johto (Pokemon TCG Platform), establishing best practice conventions for spec-driven development with Bun, React 19, Rust, TypeScript, and GraphQL.

## Structure

- **CLAUDE.md** - Project context and development standards (auto-loaded)
- **agents/** - Specialized subagents for different development contexts
- **skills/** - Modular capabilities that load on-demand
- **settings.json** - Permissions, hooks, and lifecycle configuration
- **README.md** - This file
- **QUICK_REFERENCE.md** - Quick command reference

## Quick Start

### Start Development

```bash
# Default agent with full capabilities
claude

# Specialized agent for React frontend development
claude --agent bun-react-frontend

# Specialized agent for Rust API development
claude --agent rust-graphql-api

# Resume previous session
claude --resume
```

### Within Claude Code

```
/usage              # View context window usage
/compact            # Summarize conversation history
/context add file   # Add file to context
/context show       # View current context
/help               # List available commands
```

## Agents

### bun-react-frontend

Specialized for React 19 frontend development with Bun runtime, SSR, and Pokemon TCG UI.

**Best for:**

- Creating React components
- Implementing SSR patterns
- Building Pokemon card UI
- Working with Webpack builds
- Creating Storybook stories

**Includes:**

- react-bun-ssr skill
- pokemon-tcg-data skill

### rust-graphql-api

Specialized for Rust backend development with Actix-web, GraphQL, and databases.

**Best for:**

- Building GraphQL schemas
- Database operations (PostgreSQL, Neo4j)
- Rust async patterns
- API endpoint development
- Performance optimization

**Includes:**

- rust-actix-graphql skill
- pokemon-tcg-data skill

### Default Agent

General-purpose agent with full capabilities.

**Best for:**

- Infrastructure and Docker
- Build system configuration
- Cross-cutting concerns
- Data management scripts
- General development tasks

## Skills

Skills are modular capabilities that load automatically based on relevance.

### react-bun-ssr

React 19 patterns with Bun runtime, SSR, hydration, and modern React features.

**Activates for:** React components, SSR implementation, Bun runtime usage

### rust-actix-graphql

Rust patterns with Actix-web, async-graphql, PostgreSQL, and Neo4j.

**Activates for:** Rust development, GraphQL schemas, database operations

### pokemon-tcg-data

Pokemon TCG data structures, validation, and management patterns.

**Activates for:** Card data, deck validation, collection management, TCG rules

### docker-infrastructure

Docker and docker-compose patterns for multi-service deployment.

**Activates for:** Docker configuration, service orchestration, deployment

## Configuration

### settings.json

Controls permissions and lifecycle hooks:

```json
{
  "permissions": {
    "allow": [
      "Read(**/*.{ts,tsx,js,rs,md,json})",
      "Write(apps/**/*.{ts,tsx,rs})",
      "Bash(bun :*)",
      "Bash(cargo :*)",
      "Bash(docker :*)"
    ],
    "deny": ["Read(.env*)", "Write(node_modules/**)", "Bash(rm -rf :*)"]
  }
}
```

## Project Context

CLAUDE.md contains:

- Project overview and architecture
- Technology stack details
- Development standards
- Technical decisions
- Common operations
- Deployment strategies

This context loads automatically with every Claude Code session.

## Development Workflow

### Creating a React Component

```bash
claude --agent bun-react-frontend
# "Create a PokemonCard component with image, HP, and type display"
```

Claude will:

1. Create component structure (PokemonCard.tsx, types.ts, CSS)
2. Implement responsive card layout
3. Add TypeScript types
4. Create Storybook story
5. Add accessibility features

### Adding a GraphQL Endpoint

```bash
claude --agent rust-graphql-api
# "Add a GraphQL query to search cards by name and type"
```

Claude will:

1. Define GraphQL schema
2. Create database query
3. Implement resolver function
4. Add error handling
5. Write unit tests

### Setting Up Infrastructure

```bash
claude
# "Create Docker configuration for the Neo4j database"
```

Claude will:

1. Create docker-compose.yml configuration
2. Set up volumes and networks
3. Configure health checks
4. Add initialization scripts
5. Document environment variables

## Permissions

Default permissions allow:

- **Read**: All source files, configs, markdown, Rust, TypeScript
- **Write**: Source code in apps/, packages/, docker/
- **Bash**: bun, cargo, docker, docker compose, git log
- **Deny**: Environment files, node_modules, target, dangerous commands

Adjust in settings.json as needed.

## Best Practices

1. **Use specialized agents** - Different agents for different tasks
2. **Leverage skills** - They activate automatically based on context
3. **Keep CLAUDE.md updated** - It's your project memory
4. **Review permissions** - Ensure they match your workflow
5. **Test with Docker** - Verify all services work together
6. **Monitor context** - Use `/usage` to stay aware
7. **Compact regularly** - Use `/compact` in long sessions

## Troubleshooting

### Agent not loading

```bash
ls -la .claude/agents/
```

### Skills not activating

Skills activate based on relevance. Verify skill description matches your task.

### Permissions not working

Check pattern syntax in settings.json:

```bash
cat .claude/settings.json | jq '.permissions'
```

### Context issues

Verify CLAUDE.md is properly formatted:

```bash
cat .claude/CLAUDE.md | head -20
```

## Project Structure Overview

```
Pokemon/
├── apps/
│   ├── web/                    # React 19 + Bun frontend
│   ├── tcg-api/                # Rust + GraphQL API
│   ├── distributed-ledger/     # Rust blockchain
│   └── scripts/                # Data sync scripts
├── packages/
│   ├── @clients/               # API clients
│   ├── @configs/               # Shared configs
│   ├── @database/              # Database utilities
│   ├── @logger/                # Logging
│   ├── @pokemon-data/          # TCG data
│   └── @utils/                 # Utilities
├── docker/                     # Docker configs
├── .claude/                    # Claude Code config
└── docker-compose.yml          # Service orchestration
```

## Tech Stack Summary

**Frontend:**

- React 19.2 with SSR
- Bun 1.3.5 runtime
- TypeScript 5.5
- Webpack 5
- Storybook 8.5

**Backend:**

- Rust with Actix-web
- async-graphql
- PostgreSQL (sqlx)
- Neo4j (neo4rs)
- Tokio runtime

**Infrastructure:**

- Docker & Docker Compose
- Turborepo
- PostgreSQL
- Neo4j

## Common Operations

```bash
# Development
bun run dev                     # Start all services
docker compose up               # Start with Docker

# Frontend
cd apps/web
bun run dev                     # Dev server
bun run storybook               # Storybook

# Backend
cd apps/tcg-api
cargo run                       # Run API
cargo test                      # Run tests

# Database
docker compose up postgres neo4j
bun run json:sync               # Sync Pokemon data

# Quality
bun run lint                    # Lint all code
bun run format                  # Format code
bun run check-types             # Type check
```

## Resources

- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [CLAUDE.md](./CLAUDE.md) - Project context
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick commands
- [Skills](./skills/) - Domain expertise modules
- [Agents](./agents/) - Specialized subagents

## Support

For issues or questions:

1. Check Claude Code docs
2. Review CLAUDE.md for project context
3. Consult relevant skill for domain patterns
4. Use `/help` within Claude Code
