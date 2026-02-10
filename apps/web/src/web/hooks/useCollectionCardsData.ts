import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { graphqlClient } from '../graphql/client';
import { GET_CARD_BY_ID } from '../graphql/documents';
import type {
  GetCardDetailResponse,
  CardDetail,
  GetCardVariables
} from '../graphql/types';
import type { CollectionCard } from '../../types/collection';

/**
 * Fetches card data for all cards in a collection
 * Uses parallel queries for efficient batch fetching
 */
export function useCollectionCardsData(collectionCards: CollectionCard[]) {
  const queries = useQueries({
    queries: collectionCards.map((collectionCard) => ({
      queryKey: ['card', collectionCard.cardId],
      queryFn: async () => {
        const variables: GetCardVariables = { cardId: collectionCard.cardId };
        const data = await graphqlClient.request<GetCardDetailResponse>(
          GET_CARD_BY_ID,
          variables
        );
        return data.card;
      },
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      enabled: !!collectionCard.cardId
    }))
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isFetching = queries.some((q) => q.isFetching);
  const isError = queries.some((q) => q.isError);
  const errors = queries.filter((q) => q.error).map((q) => q.error);

  // Combine card data with collection quantity info
  const cards = useMemo(() => {
    const result: Array<CardDetail & { quantity: number; dateAdded: string }> =
      [];

    queries.forEach((query, index) => {
      if (query.data) {
        result.push({
          ...query.data,
          quantity: collectionCards[index].quantity,
          dateAdded: collectionCards[index].dateAdded
        });
      }
    });

    // Sort by date added (most recent first)
    return result.sort(
      (a, b) =>
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );
  }, [queries, collectionCards]);

  return {
    cards,
    isLoading,
    isFetching,
    isError,
    errors
  };
}

/**
 * Convert CardDetail from GraphQL to Pokemon.Card-compatible format
 * for use with existing components
 */
export function cardToDisplayFormat(card: CardDetail): {
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
    releaseDate?: string;
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
