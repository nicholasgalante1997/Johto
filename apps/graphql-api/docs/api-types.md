# Types & Schema

The complete GraphQL type definitions served by the API.

---

## Card

A single Pokemon TCG card with all associated metadata.

```graphql
type Card {
  id: ID! # Unique card identifier (e.g. "base1-1")
  name: String! # Card name
  supertype: String! # "Pokémon", "Trainer", or "Energy"
  subtypes: [String!] # e.g. ["Basic", "Stage 1"]
  hp: Int # Hit points (Pokémon cards only)
  types: [String!] # Energy types (e.g. ["Fire", "Colorless"])
  evolvesFrom: String # Name of the card this evolves from
  evolvesTo: [String!] # Names of cards this evolves into
  rules: [String!] # Rule-box text lines
  abilities: [Ability!] # Abilities (typically one)
  attacks: [Attack!] # Attack definitions
  weaknesses: [Weakness!] # Type weaknesses
  resistances: [Resistance!] # Type resistances
  retreatCost: [String!] # Energy symbols required to retreat
  convertedRetreatCost: Int # Numeric retreat cost
  set: Set! # The set this card belongs to
  number: String! # Collector number within the set
  artist: String # Card artist credit
  rarity: String # Rarity string (e.g. "Rare Holo")
  flavorText: String # Flavor text on the card
  nationalPokedexNumbers: [Int!] # Pokedex numbers of the Pokemon
  legalities: Legalities # Format legalities
  images: CardImages # Card image URLs
  tcgplayerUrl: String # TCGPlayer product URL
  cardmarketUrl: String # Cardmarket product URL
  createdAt: String # Row creation timestamp
  updatedAt: String # Row update timestamp
}
```

---

## Set

A Pokemon TCG expansion set containing a collection of cards.

```graphql
type Set {
  id: ID! # Unique set identifier
  name: String! # Set name
  series: String! # Series the set belongs to
  printedTotal: Int! # Number of cards in the printed set
  total: Int! # Total cards including secret rares
  images: SetImages # Set logo and symbol images
  legalities: Legalities # Format legalities for this set
  ptcgoCode: String # PTCGO set code
  releaseDate: String! # Release date
  updatedAt: String # Row update timestamp
  createdAt: String # Row creation timestamp
  cards(limit: Int = 60, offset: Int = 0): [Card!]! # Cards in this set (dataloader-resolved)
  cardCount: Int! # Total number of cards (dataloader-resolved)
}
```

The `cards` and `cardCount` fields are resolved via dataloaders. When you request multiple sets, the underlying card queries are batched into a single SQL statement — see [Dataloaders](architecture-dataloaders.md).

---

## User

A platform user account.

```graphql
type User {
  id: ID!
  username: String!
  email: String!
  createdAt: String
  updatedAt: String
}
```

---

## Supporting Types

### Ability

```graphql
type Ability {
  name: String! # Ability name
  text: String! # Rules text describing the ability
  type: String! # Ability type (e.g. "Ability")
}
```

### Attack

```graphql
type Attack {
  name: String! # Attack name
  cost: [String!]! # Energy cost as symbol strings
  convertedEnergyCost: Int! # Numeric total energy cost
  damage: String # Damage value (may include modifiers like "60+")
  text: String # Additional attack text
}
```

### Weakness / Resistance

```graphql
type Weakness {
  type: String! # Energy type (e.g. "Water")
  value: String! # Modifier (e.g. "×2")
}

type Resistance {
  type: String! # Energy type
  value: String! # Modifier (e.g. "-30")
}
```

### Legalities

```graphql
type Legalities {
  unlimited: String # "Legal" or "Not Legal"
  standard: String # "Legal", "Not Legal", or null if not applicable
  expanded: String # "Legal" or "Not Legal"
}
```

### Images

```graphql
type CardImages {
  small: String # Small card image URL
  large: String # Large card image URL
}

type SetImages {
  symbol: String # Set symbol image URL
  logo: String # Set logo image URL
}
```

---

## Utility Types

### Stats

```graphql
type Stats {
  totalCards: Int! # Total cards in the database
  totalSets: Int! # Total sets in the database
  lastUpdated: String # Timestamp of the most recent database update
}
```

### HealthCheck

```graphql
type HealthCheck {
  status: String! # "healthy" or "unhealthy"
  database: String! # Database connectivity status
  uptime: Int! # Server uptime in seconds
  timestamp: String! # Current server timestamp
}
```
