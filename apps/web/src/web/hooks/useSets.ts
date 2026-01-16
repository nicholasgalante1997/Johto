import { useState, useEffect, useCallback } from 'react';
import type { Pokemon } from '@pokemon/clients';

export interface UseSetsResult {
  /** Array of sets */
  sets: Pokemon.Set[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch function */
  refetch: () => void;
}

const API_BASE = '/api/v1';

/**
 * Hook for fetching Pokemon TCG sets from the API
 */
export function useSets(): UseSetsResult {
  const [sets, setSets] = useState<Pokemon.Set[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/sets`);

      if (!response.ok) {
        throw new Error(`Failed to fetch sets: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle the API response format
      if (data.data) {
        setSets(data.data);
      } else if (Array.isArray(data)) {
        setSets(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setSets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  return {
    sets,
    loading,
    error,
    refetch: fetchSets,
  };
}
