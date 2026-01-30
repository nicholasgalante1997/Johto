import { getDatabase } from '../db';

export type EndpointHealth = 'healthy' | 'degraded' | 'unhealthy';

export type EndpointInfo = {
  path: string;
  method: string;
  description: string;
  parameters?: {
    name: string;
    type: 'path' | 'query';
    required: boolean;
    description: string;
  }[];
  health: EndpointHealth;
};

export type DiscoveryResponse = {
  service: string;
  version: string;
  status: EndpointHealth;
  endpoints: EndpointInfo[];
};

/**
 * Registry of all available API endpoints
 */
const ENDPOINT_REGISTRY: Omit<EndpointInfo, 'health'>[] = [
  {
    path: '/api/v1',
    method: 'GET',
    description:
      'API discovery endpoint - lists all available endpoints with health status'
  },
  {
    path: '/api/v1/cards',
    method: 'GET',
    description: 'List all Pokemon cards with pagination support',
    parameters: [
      {
        name: 'page',
        type: 'query',
        required: false,
        description: 'Page number (default: 1)'
      },
      {
        name: 'limit',
        type: 'query',
        required: false,
        description: 'Items per page (default: 20, max: 100)'
      }
    ]
  },
  {
    path: '/api/v1/cards/:id',
    method: 'GET',
    description: 'Get a specific Pokemon card by ID with full set information',
    parameters: [
      {
        name: 'id',
        type: 'path',
        required: true,
        description: 'The unique card identifier'
      }
    ]
  },
  {
    path: '/api/v1/sets',
    method: 'GET',
    description: 'List all Pokemon TCG sets with pagination support',
    parameters: [
      {
        name: 'page',
        type: 'query',
        required: false,
        description: 'Page number (default: 1)'
      },
      {
        name: 'limit',
        type: 'query',
        required: false,
        description: 'Items per page (default: 20, max: 100)'
      }
    ]
  },
  {
    path: '/api/v1/sets/:id',
    method: 'GET',
    description: 'Get a specific Pokemon TCG set by ID',
    parameters: [
      {
        name: 'id',
        type: 'path',
        required: true,
        description: 'The unique set identifier'
      }
    ]
  },
  {
    path: '/api/v1/sets/:id/cards',
    method: 'GET',
    description: 'List all cards in a specific set with pagination support',
    parameters: [
      {
        name: 'id',
        type: 'path',
        required: true,
        description: 'The set identifier'
      },
      {
        name: 'page',
        type: 'query',
        required: false,
        description: 'Page number (default: 1)'
      },
      {
        name: 'limit',
        type: 'query',
        required: false,
        description: 'Items per page (default: 20, max: 100)'
      }
    ]
  }
];

/**
 * Check database connectivity for health status
 */
function checkDatabaseHealth(): EndpointHealth {
  try {
    const db = getDatabase();
    const result = db.query('SELECT 1 as ok').get() as { ok: number } | null;
    return result?.ok === 1 ? 'healthy' : 'degraded';
  } catch {
    return 'unhealthy';
  }
}

/**
 * Build the discovery response with current health status
 */
function buildDiscoveryResponse(): DiscoveryResponse {
  const dbHealth = checkDatabaseHealth();

  const endpoints: EndpointInfo[] = ENDPOINT_REGISTRY.map((endpoint) => ({
    ...endpoint,
    health: endpoint.path === '/api/v1' ? 'healthy' : dbHealth
  }));

  const overallHealth =
    dbHealth === 'healthy'
      ? 'healthy'
      : dbHealth === 'degraded'
        ? 'degraded'
        : 'unhealthy';

  return {
    service: 'Pokemon TCG Web API',
    version: 'v1',
    status: overallHealth,
    endpoints
  };
}

/**
 * Render discovery response as HTML
 */
function renderHtml(data: DiscoveryResponse): string {
  const statusColor = {
    healthy: '#22c55e',
    degraded: '#eab308',
    unhealthy: '#ef4444'
  };

  const endpointRows = data.endpoints
    .map((ep) => {
      const paramsHtml = ep.parameters
        ? `<ul class="params">${ep.parameters
            .map(
              (p) =>
                `<li><code>${p.name}</code> (${p.type}${p.required ? ', required' : ''}) - ${p.description}</li>`
            )
            .join('')}</ul>`
        : '';

      return `
      <tr>
        <td><code>${ep.method}</code></td>
        <td><code>${ep.path}</code></td>
        <td>${ep.description}${paramsHtml}</td>
        <td><span class="status" style="background: ${statusColor[ep.health]}">${ep.health}</span></td>
      </tr>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.service} - API Discovery</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 2rem;
      line-height: 1.6;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    h1 {
      font-size: 1.875rem;
      margin-bottom: 0.5rem;
      color: #f8fafc;
    }
    .version {
      color: #94a3b8;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }
    .overall-status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #1e293b;
      border-radius: 0.5rem;
      margin-bottom: 2rem;
    }
    .status {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #1e293b;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #334155;
    }
    th {
      background: #334155;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: #334155; }
    code {
      background: #0f172a;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      color: #38bdf8;
    }
    .params {
      margin-top: 0.5rem;
      padding-left: 1.25rem;
      font-size: 0.875rem;
      color: #94a3b8;
    }
    .params li { margin-bottom: 0.25rem; }
    .params code { font-size: 0.75rem; }
    .tip {
      margin-top: 2rem;
      padding: 1rem;
      background: #1e293b;
      border-radius: 0.5rem;
      border-left: 4px solid #3b82f6;
      font-size: 0.875rem;
      color: #94a3b8;
    }
    .tip code { color: #a5b4fc; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${data.service}</h1>
    <p class="version">Version: ${data.version}</p>
    <div class="overall-status">
      <span>Service Status:</span>
      <span class="status" style="background: ${statusColor[data.status]}">${data.status}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Method</th>
          <th>Endpoint</th>
          <th>Description</th>
          <th>Health</th>
        </tr>
      </thead>
      <tbody>
        ${endpointRows}
      </tbody>
    </table>
    <div class="tip">
      <strong>Tip:</strong> Request this endpoint with <code>Accept: application/json</code> header to get JSON response.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Determine response format based on Accept header
 */
function shouldReturnHtml(request: Request): boolean {
  const accept = request.headers.get('Accept') || '';

  // If explicitly requesting JSON, return JSON
  if (accept.includes('application/json')) {
    return false;
  }

  // If requesting HTML or wildcard (browser default), return HTML
  if (accept.includes('text/html') || accept.includes('*/*') || accept === '') {
    return true;
  }

  // Default to JSON for API clients
  return false;
}

/**
 * GET /api/v1/endpoints
 * API discovery endpoint
 */
export async function getApiDiscovery(request: Request): Promise<Response> {
  const data = buildDiscoveryResponse();

  if (shouldReturnHtml(request)) {
    return new Response(renderHtml(data), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  return new Response(JSON.stringify({ data }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
