import { buildSchema } from 'graphql';

export const schema = buildSchema(`
  type Query {
    # User queries
    user(id: ID!): User
    users(limit: Int = 10): [User!]!

    # Set queries
    set(id: ID!): Set
    sets(limit: Int = 10): [Set!]!
    setsBySeries(series: String!): [Set!]!

    # Card queries
    card(id: ID!): Card
    cardsBySet(setId: ID!): [Card!]!
    cardsByName(name: String!): [Card!]!
    cards(limit: Int = 10, offset: Int = 0): [Card!]!

    # Deck queries

  }

  type User {
    id: ID!
    username: String!
    email: String!
    createdAt: String
    updatedAt: String
  }

  type Set {
    id: ID!
    name: String!
    series: String!
    printed_total: Int!
    total: Int!
    images: String!
    legalities: String!
    ptcgo_code: String!
    release_date: String!
    updated_at: String
    created_at: String
  }

  type Card {
    id: ID!
    name: String!
    supertype: String!
    subtypes: String!
    hp: Int
    types: String
    evolves_from: String
    evolves_to: String
    rules: String
    abilities: String
    attacks: String
    weaknesses: String
    retreat_cost: String
    converted_retreat_cost: Int
    set_id: String!
    number: String!
    artist: String
    rarity: String
    flavor_text: String
    national_pokedex_numbers: String
    legalities: String
    images: String
    tcgplayer_url: String
    cardmarket_url: String
    created_at: String
    updated_at: String
  }

  type Deck {
    id: ID!
    name: String!
    cards: [String!]!
    metadata: String
  }
`);
