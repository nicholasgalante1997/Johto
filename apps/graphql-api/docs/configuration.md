# Configuration

All configuration is driven by environment variables. Defaults are chosen so the API works out of the box in the development monorepo without any `.env` file.

## Environment Variables

| Variable                   | Default                              | Description                                          |
| -------------------------- | ------------------------------------ | ---------------------------------------------------- |
| `GRAPHQL_API_PORT`         | `3002`                               | TCP port the server binds to                         |
| `GRAPHQL_API_HOST`         | `0.0.0.0`                            | Network interface to bind                            |
| `DATABASE_PATH`            | `./database/pokemon-data.sqlite3.db` | Path to the SQLite database file                     |
| `DATABASE_READONLY`        | `true`                               | Open the database in read-only mode                  |
| `APOLLO_INTROSPECTION`     | `true`                               | Enable GraphQL introspection queries                 |
| `APOLLO_PLAYGROUND`        | `true`                               | Enable the GraphiQL IDE at `/graphiql`               |
| `GRAPHQL_COMPLEXITY_LIMIT` | `1000`                               | Maximum allowed query complexity score               |
| `CORS_ORIGINS`             | `*`                                  | Comma-separated list of allowed CORS origins         |
| `LOG_LEVEL`                | `info`                               | Logging verbosity (`debug`, `info`, `warn`, `error`) |
| `LOG_FORMAT`               | `json`                               | Log output format (`json` or `text`)                 |

## Production Recommendations

```bash
# Lock down CORS to your frontend origins
CORS_ORIGINS=https://pokemon.example.com,https://app.pokemon.example.com

# Disable introspection in production to hide the schema
APOLLO_INTROSPECTION=false

# Keep the database read-only (default)
DATABASE_READONLY=true

# Structured JSON logs for your log aggregator
LOG_FORMAT=json
LOG_LEVEL=warn
```

## Docker Compose Override

When running via Docker Compose, environment variables are set in the service definition and the database is mounted as a read-only volume:

```yaml
environment:
  - GRAPHQL_API_PORT=3002
  - DATABASE_PATH=/data/pokemon-data.sqlite3.db
  - APOLLO_INTROSPECTION=true
  - CORS_ORIGINS=http://localhost:3000,http://bun-pokemon-web-server:3000
volumes:
  - ../../database:/data:ro
```

See [Deployment](deployment.md) for the full Docker setup.
