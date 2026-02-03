import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '../graphql/client';
import { SEARCH_CARDS } from '../graphql/documents';
import type {
  SearchCardsResponse,
  SearchCardsVariables,
  SearchCardNode
} from '../graphql/types';

const DEBOUNCE_MS = 300;
const DEFAULT_LIMIT = 100;

/**
 * Hook to search cards with debounced input
 * Returns cards sorted by most recently released (set release date)
 */
export function useSearchCards(
  searchTerm: string,
  options: {
    limit?: number;
    enabled?: boolean;
  } = {}
) {
  const { limit = DEFAULT_LIMIT, enabled = true } = options;
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  // Debounce the search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const query = useQuery({
    queryKey: ['searchCards', debouncedTerm, limit],
    queryFn: async () => {
      const variables: SearchCardsVariables = {
        limit,
        offset: 0
      };

      // Only add name filter if there's a search term
      if (debouncedTerm.trim()) {
        variables.name = debouncedTerm.trim();
      }

      const data = await graphqlClient.request<SearchCardsResponse>(
        SEARCH_CARDS,
        variables
      );

      return data.cards;
    },
    enabled: enabled,
    staleTime: 30000 // Cache for 30 seconds
  });

  // Sort cards by set release date (most recent first) and map to a flat structure
  const cards = useMemo(() => {
    if (!query.data?.edges) return [];

    const sortedCards = [...query.data.edges]
      .sort((a, b) => {
        const dateA = new Date(a.node.set.releaseDate).getTime();
        const dateB = new Date(b.node.set.releaseDate).getTime();
        return dateB - dateA; // Most recent first
      })
      .map((edge) => edge.node);

    return sortedCards;
  }, [query.data]);

  return {
    cards,
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isError: query.isError,
    debouncedTerm
  };
}

/**
 * Convert SearchCardNode to Pokemon.Card-compatible format
 * for use with existing components
 */
export function toCardFormat(card: SearchCardNode): {
  id: string;
  name: string;
  hp?: string;
  supertype: string;
  subtypes?: string[];
  types?: string[];
  rarity?: string;
  artist?: string;
  number: string;
  images?: {
    small?: string;
    large?: string;
  };
  legalities?: {
    standard?: string;
    expanded?: string;
    unlimited?: string;
  };
  set?: {
    id: string;
    name: string;
    releaseDate: string;
  };
} {
  return {
    id: card.id,
    name: card.name,
    hp: card.hp?.toString(),
    supertype: card.supertype,
    subtypes: card.subtypes,
    types: card.types,
    rarity: card.rarity,
    artist: card.artist,
    number: card.number,
    images: card.images,
    legalities: card.legalities,
    set: card.set
  };
}
