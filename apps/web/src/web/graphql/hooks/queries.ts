/**
 * REACT-QUERY HOOKS FOR GRAPHQL QUERIES
 *
 * Custom hooks that wrap GraphQL queries with react-query for automatic
 * caching, background updates, and loading/error states
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { graphqlClient } from '../client';
import {
  GET_ALL_USERS,
  GET_USER_BY_ID,
  GET_ALL_SETS,
  GET_SET_BY_ID,
  GET_SETS_BY_SERIES,
  GET_CARD_BY_ID,
  GET_CARDS_BY_SET,
  GET_CARDS_BY_NAME,
  GET_ALL_CARDS
} from '../documents';
import type {
  User,
  Set,
  Card,
  GetUsersResponse,
  GetUserResponse,
  GetSetsResponse,
  GetSetResponse,
  GetSetsBySeriesResponse,
  GetCardResponse,
  GetCardsBySetResponse,
  GetCardsByNameResponse,
  GetCardsResponse,
  GetUsersVariables,
  GetUserVariables,
  GetSetsVariables,
  GetSetVariables,
  GetSetsBySeriesVariables,
  GetCardVariables,
  GetCardsBySetVariables,
  GetCardsByNameVariables,
  GetCardsVariables
} from '../types';

// ============================================================================
// USER QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch all users with optional limit
 */
export function useUsers(
  variables?: GetUsersVariables,
  options?: Omit<UseQueryOptions<User[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<User[], Error>({
    queryKey: ['users', variables],
    queryFn: async () => {
      const data = await graphqlClient.request<GetUsersResponse>(
        GET_ALL_USERS,
        variables || {}
      );
      return data.users;
    },
    ...options
  });
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(
  userId: string,
  options?: Omit<UseQueryOptions<User, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<User, Error>({
    queryKey: ['user', userId],
    queryFn: async () => {
      const data = await graphqlClient.request<
        GetUserResponse,
        GetUserVariables
      >(GET_USER_BY_ID, { userId });
      return data.user;
    },
    enabled: !!userId,
    ...options
  });
}

// ============================================================================
// SET QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch all sets with optional limit
 */
export function useSets(
  variables?: GetSetsVariables,
  options?: Omit<UseQueryOptions<Set[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Set[], Error>({
    queryKey: ['sets', variables],
    queryFn: async () => {
      const data = await graphqlClient.request<GetSetsResponse>(
        GET_ALL_SETS,
        variables || {}
      );
      return data.sets;
    },
    ...options
  });
}

/**
 * Hook to fetch a single set by ID
 */
export function useSet(
  setId: string,
  options?: Omit<UseQueryOptions<Set, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Set, Error>({
    queryKey: ['set', setId],
    queryFn: async () => {
      const data = await graphqlClient.request<GetSetResponse, GetSetVariables>(
        GET_SET_BY_ID,
        { setId }
      );
      return data.set;
    },
    enabled: !!setId,
    ...options
  });
}

/**
 * Hook to fetch sets by series name
 */
export function useSetsBySeries(
  series: string,
  options?: Omit<UseQueryOptions<Set[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Set[], Error>({
    queryKey: ['sets', 'series', series],
    queryFn: async () => {
      const data = await graphqlClient.request<
        GetSetsBySeriesResponse,
        GetSetsBySeriesVariables
      >(GET_SETS_BY_SERIES, { series });
      return data.setsBySeries;
    },
    enabled: !!series,
    ...options
  });
}

// ============================================================================
// CARD QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch a single card by ID
 */
export function useCard(
  cardId: string,
  options?: Omit<UseQueryOptions<Card, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Card, Error>({
    queryKey: ['card', cardId],
    queryFn: async () => {
      const data = await graphqlClient.request<
        GetCardResponse,
        GetCardVariables
      >(GET_CARD_BY_ID, { cardId });
      return data.card;
    },
    enabled: !!cardId,
    ...options
  });
}

/**
 * Hook to fetch all cards from a specific set
 */
export function useCardsBySet(
  setId: string,
  options?: Omit<UseQueryOptions<Card[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Card[], Error>({
    queryKey: ['cards', 'set', setId],
    queryFn: async () => {
      const data = await graphqlClient.request<
        GetCardsBySetResponse,
        GetCardsBySetVariables
      >(GET_CARDS_BY_SET, { setId });
      return data.cardsBySet;
    },
    enabled: !!setId,
    ...options
  });
}

/**
 * Hook to search for cards by name
 */
export function useCardsByName(
  name: string,
  options?: Omit<UseQueryOptions<Card[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Card[], Error>({
    queryKey: ['cards', 'name', name],
    queryFn: async () => {
      const data = await graphqlClient.request<
        GetCardsByNameResponse,
        GetCardsByNameVariables
      >(GET_CARDS_BY_NAME, { name });
      return data.cardsByName;
    },
    enabled: !!name && name.length > 0,
    ...options
  });
}

/**
 * Hook to fetch all cards with pagination
 */
export function useCards(
  variables?: GetCardsVariables,
  options?: Omit<UseQueryOptions<Card[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Card[], Error>({
    queryKey: ['cards', variables],
    queryFn: async () => {
      const data = await graphqlClient.request<GetCardsResponse>(
        GET_ALL_CARDS,
        variables || { limit: 10, offset: 0 }
      );
      return data.cards;
    },
    ...options
  });
}
