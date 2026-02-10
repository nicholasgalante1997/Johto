import 'dotenv/config';

export interface Config {
  port: number;
  host: string;
  database: {
    path: string;
    readonly: boolean;
  };
  apollo: {
    introspection: boolean;
    playground: boolean;
    complexityLimit: number;
  };
  cors: {
    origins: string[];
  };
  logging: {
    level: string;
    format: string;
  };
}

function parseOrigins(value: string | undefined): string[] {
  if (!value) return ['*'];
  return value.split(',').map((s) => s.trim());
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env.GRAPHQL_API_PORT || '3002', 10),
    host: process.env.GRAPHQL_API_HOST || '0.0.0.0',
    database: {
      path: process.env.DATABASE_PATH || './database/pokemon-data.sqlite3.db',
      readonly: process.env.DATABASE_READONLY !== 'false'
    },
    apollo: {
      introspection: process.env.APOLLO_INTROSPECTION !== 'false',
      playground: process.env.APOLLO_PLAYGROUND !== 'false',
      complexityLimit: parseInt(
        process.env.GRAPHQL_COMPLEXITY_LIMIT || '1000',
        10
      )
    },
    cors: {
      origins: parseOrigins(process.env.CORS_ORIGINS)
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json'
    }
  };
}
