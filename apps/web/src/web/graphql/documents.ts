/**
 * GRAPHQL QUERY AND MUTATION DOCUMENTS
 *
 * All GraphQL operations defined using gql tagged template literals
 */

import { gql } from 'graphql-request';

// ============================================================================
// USER QUERIES
// ============================================================================

export const GET_ALL_USERS = gql`
  query GetAllUsers($limit: Int = 10) {
    users(limit: $limit) {
      id
      username
      email
      createdAt
      updatedAt
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUser($userId: ID!) {
    user(id: $userId) {
      id
      username
      email
      createdAt
      updatedAt
    }
  }
`;

// ============================================================================
// SET QUERIES
// ============================================================================

export const GET_ALL_SETS = gql`
  query GetAllSets($limit: Int = 10) {
    sets(limit: $limit) {
      id
      name
      series
      printed_total
      total
      ptcgo_code
      release_date
      images
      created_at
      updated_at
    }
  }
`;

export const GET_SET_BY_ID = gql`
  query GetSet($setId: ID!) {
    set(id: $setId) {
      id
      name
      series
      printed_total
      total
      ptcgo_code
      release_date
      images
      legalities
      created_at
      updated_at
    }
  }
`;

export const GET_SETS_BY_SERIES = gql`
  query GetSetsBySeries($series: String!) {
    setsBySeries(series: $series) {
      id
      name
      series
      printed_total
      total
      release_date
      images
    }
  }
`;

// ============================================================================
// CARD QUERIES
// ============================================================================

export const GET_CARD_BY_ID = gql`
  query GetCard($cardId: ID!) {
    card(id: $cardId) {
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
        type
        text
      }
      attacks {
        name
        cost
        damage
        text
        convertedEnergyCost
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
        standard
        expanded
        unlimited
      }
      images {
        small
        large
      }
      set {
        id
        name
        releaseDate
      }
      tcgplayerUrl
      cardmarketUrl
      createdAt
      updatedAt
    }
  }
`;

export const GET_CARDS_BY_SET = gql`
  query GetCardsBySet($setId: ID!) {
    cardsBySet(setId: $setId) {
      id
      name
      supertype
      subtypes
      hp
      types
      rarity
      artist
      number
      images
      attacks
      abilities
    }
  }
`;

export const GET_CARDS_BY_NAME = gql`
  query GetCardsByName($name: String!) {
    cardsByName(name: $name) {
      id
      name
      hp
      supertype
      subtypes
      rarity
      artist
      images
      set_id
      number
    }
  }
`;

export const SEARCH_CARDS = gql`
  query SearchCards($name: String, $limit: Int = 100, $offset: Int = 0) {
    cards(name: $name, limit: $limit, offset: $offset) {
      edges {
        node {
          id
          name
          hp
          supertype
          subtypes
          types
          rarity
          artist
          number
          images {
            small
            large
          }
          legalities {
            standard
            expanded
            unlimited
          }
          set {
            id
            name
            releaseDate
          }
        }
      }
      totalCount
    }
  }
`;

export const GET_ALL_CARDS = gql`
  query GetAllCards($limit: Int = 10, $offset: Int = 0) {
    cards(limit: $limit, offset: $offset) {
      id
      name
      hp
      supertype
      rarity
      artist
      images
      set_id
      number
    }
  }
`;

// ============================================================================
// USER MUTATIONS
// ============================================================================

export const CREATE_USER = gql`
  mutation CreateUser($username: String!, $email: String!, $password: String!) {
    createUser(username: $username, email: $email, password: $password) {
      id
      username
      email
      createdAt
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser(
    $id: ID!
    $username: String!
    $email: String!
    $password: String!
  ) {
    updateUser(
      id: $id
      username: $username
      email: $email
      password: $password
    ) {
      id
      username
      email
      updatedAt
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

// ============================================================================
// SET MUTATIONS
// ============================================================================

export const CREATE_SET = gql`
  mutation CreateSet(
    $id: ID!
    $name: String!
    $series: String!
    $printed_total: Int
    $total: Int
    $ptcgo_code: String
    $release_date: String
    $images: String
  ) {
    createSet(
      id: $id
      name: $name
      series: $series
      printed_total: $printed_total
      total: $total
      ptcgo_code: $ptcgo_code
      release_date: $release_date
      images: $images
    ) {
      id
      name
      series
      printed_total
      total
      release_date
      images
    }
  }
`;

// ============================================================================
// CARD MUTATIONS
// ============================================================================

export const CREATE_CARD = gql`
  mutation CreateCard(
    $id: ID!
    $name: String!
    $supertype: String!
    $subtypes: String!
    $hp: Int
    $types: String!
    $set_id: ID!
    $number: String!
    $rarity: String
    $artist: String
  ) {
    createCard(
      id: $id
      name: $name
      supertype: $supertype
      subtypes: $subtypes
      hp: $hp
      types: $types
      set_id: $set_id
      number: $number
      rarity: $rarity
      artist: $artist
    ) {
      id
      name
      supertype
      subtypes
      hp
      types
      rarity
      artist
      number
      images
    }
  }
`;

export const DELETE_CARD = gql`
  mutation DeleteCard($id: ID!) {
    deleteCard(id: $id)
  }
`;
