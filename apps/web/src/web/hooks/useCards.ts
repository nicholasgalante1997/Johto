import { useState, useEffect, useCallback } from 'react';
import type { Pokemon } from '@pokemon/clients';

export interface UseCardsOptions {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Search query */
  search?: string;
  /** Pokemon type filter */
  type?: string;
  /** Rarity filter */
  rarity?: string;
  /** Set filter */
  set?: string;
  /** Supertype filter (Pokemon, Trainer, Energy) */
  supertype?: string;
  /** Whether to fetch automatically */
  enabled?: boolean;
}

export interface UseCardsResult {
  /** Array of cards */
  cards: Pokemon.Card[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Pagination info */
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  };
  /** Refetch function */
  refetch: () => void;
}

const API_BASE = '/api/v1';

/**
 * Build query string from options
 */
function buildQueryString(options: UseCardsOptions): string {
  const params = new URLSearchParams();

  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.search) params.set('q', options.search);
  if (options.type) params.set('type', options.type);
  if (options.rarity) params.set('rarity', options.rarity);
  if (options.set) params.set('set', options.set);
  if (options.supertype) params.set('supertype', options.supertype);

  return params.toString();
}

/**
 * Hook for fetching cards from the API
 */
export function useCards(options: UseCardsOptions = {}): UseCardsResult {
  const {
    page = 1,
    limit = 20,
    search,
    type,
    rarity,
    set,
    supertype,
    enabled = true,
  } = options;

  const [cards, setCards] = useState<Pokemon.Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: limit,
  });

  const fetchCards = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const queryString = buildQueryString({
        page,
        limit,
        search,
        type,
        rarity,
        set,
        supertype,
      });

      const url = `${API_BASE}/cards${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle the API response format
      if (data.data) {
        setCards(data.data);
        setPagination({
          page: data.page || page,
          totalPages: Math.ceil((data.totalCount || data.count) / limit),
          totalItems: data.totalCount || data.count,
          pageSize: data.pageSize || limit,
        });
      } else if (Array.isArray(data)) {
        setCards(data);
        setPagination({
          page: 1,
          totalPages: 1,
          totalItems: data.length,
          pageSize: data.length,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, page, limit, search, type, rarity, set, supertype]);

  // Fetch on mount and when options change
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return {
    cards,
    loading,
    error,
    pagination,
    refetch: fetchCards,
  };
}
