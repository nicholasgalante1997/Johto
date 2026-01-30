import { bffConfig } from '../config';

/**
 * GraphQL API Client for communicating with the GraphQL microservice
 */
export class GraphQLClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl?: string, timeout?: number) {
    this.baseUrl = baseUrl || bffConfig.graphqlApiUrl;
    this.timeout = timeout || bffConfig.timeout;
  }

  /**
   * Execute a GraphQL query
   */
  async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const url = `${this.baseUrl}/graphql`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          query,
          variables
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`GraphQL API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        console.error('GraphQL errors:', result.errors);
        throw new Error(result.errors[0].message);
      }

      return result.data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`GraphQL API timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    return this.query<{
      stats: {
        totalCards: number;
        totalSets: number;
        lastUpdated: string | null;
      };
    }>(`
      query Stats {
        stats {
          totalCards
          totalSets
          lastUpdated
        }
      }
    `);
  }

  /**
   * Get a card with full details including set
   */
  async getCard(id: string) {
    return this.query<{
      card: any;
    }>(
      `
      query Card($id: ID!) {
        card(id: $id) {
          id
          name
          supertype
          subtypes
          hp
          types
          evolvesFrom
          evolvesTo
          rules
          abilities {
            name
            text
            type
          }
          attacks {
            name
            cost
            convertedEnergyCost
            damage
            text
          }
          weaknesses {
            type
            value
          }
          resistances {
            type
            value
          }
          retreatCost
          convertedRetreatCost
          number
          artist
          rarity
          flavorText
          nationalPokedexNumbers
          legalities {
            unlimited
            standard
            expanded
          }
          images {
            small
            large
          }
          tcgplayerUrl
          cardmarketUrl
          set {
            id
            name
            series
            total
            releaseDate
            images {
              symbol
              logo
            }
          }
        }
      }
    `,
      { id }
    );
  }

  /**
   * Get cards by name for related cards
   */
  async getCardsByName(name: string) {
    return this.query<{
      cardsByName: any[];
    }>(
      `
      query CardsByName($name: String!) {
        cardsByName(name: $name) {
          id
          name
          supertype
          types
          rarity
          images {
            small
            large
          }
          set {
            id
            name
          }
        }
      }
    `,
      { name }
    );
  }

  /**
   * Get recent sets with card counts
   */
  async getRecentSets(limit: number = 5) {
    return this.query<{
      sets: {
        edges: Array<{
          node: {
            id: string;
            name: string;
            series: string;
            total: number;
            releaseDate: string;
            images: {
              symbol: string;
              logo: string;
            };
          };
        }>;
      };
    }>(
      `
      query RecentSets($limit: Int!) {
        sets(limit: $limit) {
          edges {
            node {
              id
              name
              series
              total
              releaseDate
              images {
                symbol
                logo
              }
            }
          }
        }
      }
    `,
      { limit }
    );
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.query<{
      health: {
        status: string;
        database: string;
        uptime: number;
        timestamp: string;
      };
    }>(`
      query Health {
        health {
          status
          database
          uptime
          timestamp
        }
      }
    `);
  }
}

export const graphqlClient = new GraphQLClient();
