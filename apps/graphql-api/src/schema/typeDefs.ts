import { buildSchema } from 'graphql';

export const typeDefs = `#graphql
  type Query {
    # User queries
    user(id: ID!): User
    users(limit: Int = 10): [User!]!

    # Set queries
    set(id: ID!): Set
    sets(limit: Int = 50, offset: Int = 0): SetConnection!
    setsBySeries(series: String!): [Set!]!

    # Card queries
    card(id: ID!): Card
    cards(limit: Int = 60, offset: Int = 0, name: String, types: [String!], rarity: String, setId: String): CardConnection!
    cardsBySet(setId: ID!, limit: Int = 60, offset: Int = 0): [Card!]!
    cardsByName(name: String!): [Card!]!

    # Statistics
    stats: Stats!

    # Health
    health: HealthCheck!
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
    printedTotal: Int!
    total: Int!
    images: SetImages
    legalities: Legalities
    ptcgoCode: String
    releaseDate: String!
    updatedAt: String
    createdAt: String
    cards(limit: Int = 60, offset: Int = 0): [Card!]!
    cardCount: Int!
  }

  type SetImages {
    symbol: String
    logo: String
  }

  type Card {
    id: ID!
    name: String!
    supertype: String!
    subtypes: [String!]
    hp: Int
    types: [String!]
    evolvesFrom: String
    evolvesTo: [String!]
    rules: [String!]
    abilities: [Ability!]
    attacks: [Attack!]
    weaknesses: [Weakness!]
    resistances: [Resistance!]
    retreatCost: [String!]
    convertedRetreatCost: Int
    set: Set!
    number: String!
    artist: String
    rarity: String
    flavorText: String
    nationalPokedexNumbers: [Int!]
    legalities: Legalities
    images: CardImages
    tcgplayerUrl: String
    cardmarketUrl: String
    createdAt: String
    updatedAt: String
  }

  type Ability {
    name: String!
    text: String!
    type: String!
  }

  type Attack {
    name: String!
    cost: [String!]!
    convertedEnergyCost: Int!
    damage: String
    text: String
  }

  type Weakness {
    type: String!
    value: String!
  }

  type Resistance {
    type: String!
    value: String!
  }

  type Legalities {
    unlimited: String
    standard: String
    expanded: String
  }

  type CardImages {
    small: String
    large: String
  }

  type CardConnection {
    edges: [CardEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type CardEdge {
    node: Card!
    cursor: String!
  }

  type SetConnection {
    edges: [SetEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type SetEdge {
    node: Set!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type Stats {
    totalCards: Int!
    totalSets: Int!
    lastUpdated: String
  }

  type HealthCheck {
    status: String!
    database: String!
    uptime: Int!
    timestamp: String!
  }
`;

export const schema = buildSchema(typeDefs);
