import { bffConfig } from '../config';

/**
 * REST API Client for communicating with the REST microservice
 */
export class RestApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl?: string, timeout?: number) {
    this.baseUrl = baseUrl || bffConfig.restApiUrl;
    this.timeout = timeout || bffConfig.timeout;
  }

  /**
   * Make a GET request to the REST API
   */
  async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(path, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`REST API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`REST API timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Get cards with pagination
   */
  async getCards(page: number = 1, pageSize: number = 60) {
    return this.get<{
      data: any[];
      meta: {
        page: number;
        pageSize: number;
        count: number;
        totalCount: number;
        totalPages: number;
      };
    }>('/api/v1/cards', { page, pageSize });
  }

  /**
   * Get a single card by ID
   */
  async getCard(id: string) {
    return this.get<{ data: any }>(`/api/v1/cards/${id}`);
  }

  /**
   * Search cards
   */
  async searchCards(params: {
    name?: string;
    type?: string;
    rarity?: string;
    set?: string;
    page?: number;
    pageSize?: number;
  }) {
    return this.get<{
      data: any[];
      meta: {
        page: number;
        pageSize: number;
        count: number;
        totalCount: number;
        totalPages: number;
      };
    }>('/api/v1/cards/search', params);
  }

  /**
   * Get sets with pagination
   */
  async getSets(page: number = 1, pageSize: number = 50) {
    return this.get<{
      data: any[];
      meta: {
        page: number;
        pageSize: number;
        count: number;
        totalCount: number;
        totalPages: number;
      };
    }>('/api/v1/sets', { page, pageSize });
  }

  /**
   * Get a single set by ID
   */
  async getSet(id: string) {
    return this.get<{ data: any }>(`/api/v1/sets/${id}`);
  }

  /**
   * Get cards in a set
   */
  async getSetCards(setId: string, page: number = 1, pageSize: number = 60) {
    return this.get<{
      data: any[];
      meta: {
        page: number;
        pageSize: number;
        count: number;
        totalCount: number;
        totalPages: number;
      };
    }>(`/api/v1/sets/${setId}/cards`, { page, pageSize });
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.get<{
      status: string;
      service: string;
      timestamp: string;
    }>('/health');
  }
}

export const restApiClient = new RestApiClient();
