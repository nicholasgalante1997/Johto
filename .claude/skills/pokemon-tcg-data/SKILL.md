---
name: pokemon-tcg-data
description: Pokemon Trading Card Game data structures, validation, and management patterns for cards, sets, and collections.
tags:
  - pokemon
  - tcg
  - data
  - validation
---

# Pokemon TCG Data Management

## Purpose

Define patterns for Pokemon Trading Card Game data structures, validation rules, and data management operations.

## Priority

**High**

## Data Structures

### Pokemon Card

**ALWAYS** include core card attributes (ID: CARD_ATTRIBUTES)

```typescript
interface PokemonCard {
  // Identifiers
  id: string;              // e.g., "base1-4"
  name: string;            // e.g., "Charizard"

  // Set Information
  set_id: string;          // e.g., "base1"
  number: string;          // Card number in set
  total_in_set: number;    // Total cards in set

  // Card Stats
  hp?: string;             // Hit points, e.g., "120"
  types?: string[];        // e.g., ["Fire"]
  supertype: string;       // "Pokémon", "Trainer", "Energy"
  subtypes?: string[];     // e.g., ["Stage 2", "V", "VMAX"]

  // Battle Info
  attacks?: Attack[];
  abilities?: Ability[];
  weaknesses?: Weakness[];
  resistances?: Resistance[];
  retreat_cost?: string[]; // Energy types required

  // Evolution
  evolves_from?: string;   // Previous evolution
  evolves_to?: string[];   // Next evolutions

  // Collection Info
  rarity?: string;         // e.g., "Rare Holo", "Common"
  artist?: string;
  flavor_text?: string;

  // Images
  image_url?: string;
  image_url_hi_res?: string;

  // Market Data
  market_price?: number;
  last_updated?: string;
}

interface Attack {
  name: string;
  cost: string[];          // Energy types
  damage?: string;         // e.g., "50", "10+", "×30"
  text?: string;           // Attack description
}

interface Ability {
  name: string;
  text: string;
  type?: string;           // "Ability" or "Poké-Power" or "Poké-Body"
}

interface Weakness {
  type: string;            // Energy type
  value: string;           // e.g., "×2", "+20"
}

interface Resistance {
  type: string;
  value: string;           // e.g., "-20", "-30"
}
```

### Pokemon Set

**ALWAYS** include set metadata (ID: SET_METADATA)

```typescript
interface PokemonSet {
  id: string;              // e.g., "base1"
  name: string;            // e.g., "Base Set"
  series: string;          // e.g., "Base"
  total_cards: number;

  // Release Info
  release_date: string;    // ISO date

  // Images
  logo_url?: string;
  symbol_url?: string;

  // Legality
  standard_legal: boolean;
  expanded_legal: boolean;
  unlimited_legal: boolean;
}
```

### User Collection

**ALWAYS** track card ownership (ID: COLLECTION_TRACKING)

```typescript
interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface CollectionCard {
  collection_id: string;
  card_id: string;
  quantity: number;
  condition?: 'Mint' | 'Near Mint' | 'Lightly Played' | 'Moderately Played' | 'Heavily Played' | 'Damaged';
  notes?: string;
  acquired_date?: string;
  acquisition_price?: number;
}
```

### Deck Structure

**ALWAYS** enforce deck composition rules (ID: DECK_RULES)

```typescript
interface Deck {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  format: 'Standard' | 'Expanded' | 'Unlimited';
  is_valid: boolean;
  created_at: string;
  updated_at: string;
}

interface DeckCard {
  deck_id: string;
  card_id: string;
  quantity: number;
  category: 'Pokemon' | 'Trainer' | 'Energy';
}
```

## Validation Rules

### Card Validation

**ALWAYS** validate required fields (ID: VALIDATE_REQUIRED)

```typescript
function validateCard(card: PokemonCard): ValidationResult {
  const errors: string[] = [];

  if (!card.id) errors.push('Card ID is required');
  if (!card.name) errors.push('Card name is required');
  if (!card.set_id) errors.push('Set ID is required');
  if (!card.supertype) errors.push('Supertype is required');

  // Validate HP for Pokemon cards
  if (card.supertype === 'Pokémon') {
    if (!card.hp) {
      errors.push('HP is required for Pokemon cards');
    } else {
      const hpValue = parseInt(card.hp);
      if (isNaN(hpValue) || hpValue <= 0 || hpValue > 500) {
        errors.push('HP must be between 1 and 500');
      }
    }

    if (!card.types || card.types.length === 0) {
      errors.push('At least one type is required for Pokemon cards');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Deck Validation

**ALWAYS** enforce TCG deck rules (ID: DECK_VALIDATION)

```typescript
function validateDeck(cards: DeckCard[], cardData: Map<string, PokemonCard>): DeckValidationResult {
  const errors: string[] = [];

  // Rule 1: Exactly 60 cards
  const totalCards = cards.reduce((sum, dc) => sum + dc.quantity, 0);
  if (totalCards !== 60) {
    errors.push(`Deck must have exactly 60 cards (current: ${totalCards})`);
  }

  // Rule 2: Max 4 copies of any card (except Basic Energy)
  const cardCounts = new Map<string, number>();
  for (const deckCard of cards) {
    const card = cardData.get(deckCard.card_id);
    if (!card) continue;

    const currentCount = cardCounts.get(card.name) || 0;
    cardCounts.set(card.name, currentCount + deckCard.quantity);
  }

  for (const [cardName, count] of cardCounts) {
    if (!cardName.includes('Basic') || !cardName.includes('Energy')) {
      if (count > 4) {
        errors.push(`Too many copies of "${cardName}" (max 4, found ${count})`);
      }
    }
  }

  // Rule 3: At least one Basic Pokemon
  const hasBasicPokemon = cards.some(dc => {
    const card = cardData.get(dc.card_id);
    return card?.supertype === 'Pokémon' &&
           card?.subtypes?.includes('Basic');
  });

  if (!hasBasicPokemon) {
    errors.push('Deck must contain at least one Basic Pokemon');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
}
```

### Format Validation

**ALWAYS** check card legality in format (ID: FORMAT_LEGALITY)

```typescript
function isCardLegalInFormat(card: PokemonCard, set: PokemonSet, format: 'Standard' | 'Expanded' | 'Unlimited'): boolean {
  switch (format) {
    case 'Standard':
      return set.standard_legal;
    case 'Expanded':
      return set.expanded_legal;
    case 'Unlimited':
      return set.unlimited_legal;
    default:
      return false;
  }
}
```

## Data Management

### Card Search

**ALWAYS** support multi-criteria search (ID: SEARCH_CRITERIA)

```typescript
interface CardSearchCriteria {
  name?: string;
  types?: string[];
  supertype?: string;
  subtypes?: string[];
  set_id?: string;
  rarity?: string;
  hp_min?: number;
  hp_max?: number;
  has_ability?: boolean;
  retreat_cost_max?: number;
}

function searchCards(cards: PokemonCard[], criteria: CardSearchCriteria): PokemonCard[] {
  return cards.filter(card => {
    if (criteria.name && !card.name.toLowerCase().includes(criteria.name.toLowerCase())) {
      return false;
    }

    if (criteria.types && !criteria.types.some(t => card.types?.includes(t))) {
      return false;
    }

    if (criteria.supertype && card.supertype !== criteria.supertype) {
      return false;
    }

    if (criteria.set_id && card.set_id !== criteria.set_id) {
      return false;
    }

    if (criteria.rarity && card.rarity !== criteria.rarity) {
      return false;
    }

    if (criteria.hp_min && parseInt(card.hp || '0') < criteria.hp_min) {
      return false;
    }

    if (criteria.hp_max && parseInt(card.hp || '0') > criteria.hp_max) {
      return false;
    }

    return true;
  });
}
```

### Set Organization

**ALWAYS** group cards by set properly (ID: SET_GROUPING)

```typescript
function groupCardsBySet(cards: PokemonCard[]): Map<string, PokemonCard[]> {
  const grouped = new Map<string, PokemonCard[]>();

  for (const card of cards) {
    const setCards = grouped.get(card.set_id) || [];
    setCards.push(card);
    grouped.set(card.set_id, setCards);
  }

  // Sort cards within each set by number
  for (const [setId, cards] of grouped) {
    cards.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });
  }

  return grouped;
}
```

### Collection Statistics

**ALWAYS** provide collection insights (ID: COLLECTION_STATS)

```typescript
interface CollectionStats {
  total_cards: number;
  total_unique: number;
  by_rarity: Map<string, number>;
  by_type: Map<string, number>;
  by_set: Map<string, number>;
  completion_by_set: Map<string, { owned: number; total: number; percentage: number }>;
  estimated_value: number;
}

function calculateCollectionStats(
  collectionCards: CollectionCard[],
  allCards: PokemonCard[],
  sets: PokemonSet[]
): CollectionStats {
  const cardMap = new Map(allCards.map(c => [c.id, c]));

  const stats: CollectionStats = {
    total_cards: 0,
    total_unique: collectionCards.length,
    by_rarity: new Map(),
    by_type: new Map(),
    by_set: new Map(),
    completion_by_set: new Map(),
    estimated_value: 0
  };

  for (const cc of collectionCards) {
    const card = cardMap.get(cc.card_id);
    if (!card) continue;

    stats.total_cards += cc.quantity;

    // Count by rarity
    if (card.rarity) {
      const count = stats.by_rarity.get(card.rarity) || 0;
      stats.by_rarity.set(card.rarity, count + cc.quantity);
    }

    // Count by type
    if (card.types) {
      for (const type of card.types) {
        const count = stats.by_type.get(type) || 0;
        stats.by_type.set(type, count + cc.quantity);
      }
    }

    // Count by set
    const setCount = stats.by_set.get(card.set_id) || 0;
    stats.by_set.set(card.set_id, setCount + 1);

    // Estimate value
    if (card.market_price) {
      stats.estimated_value += card.market_price * cc.quantity;
    }
  }

  // Calculate set completion
  for (const set of sets) {
    const ownedInSet = stats.by_set.get(set.id) || 0;
    stats.completion_by_set.set(set.id, {
      owned: ownedInSet,
      total: set.total_cards,
      percentage: (ownedInSet / set.total_cards) * 100
    });
  }

  return stats;
}
```

## Data Synchronization

### JSON Data Import

**ALWAYS** validate before importing (ID: VALIDATE_IMPORT)

```typescript
async function importCardsFromJSON(filePath: string): Promise<ImportResult> {
  const data = await Bun.file(filePath).json();
  const results: ImportResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const cardData of data.cards) {
    const validation = validateCard(cardData);

    if (!validation.valid) {
      results.failed++;
      results.errors.push({
        card_id: cardData.id,
        errors: validation.errors
      });
      continue;
    }

    try {
      await saveCard(cardData);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        card_id: cardData.id,
        errors: [error.message]
      });
    }
  }

  return results;
}
```

### Database Seeding

**ALWAYS** handle duplicates gracefully (ID: HANDLE_DUPLICATES)

```typescript
async function seedCards(cards: PokemonCard[]): Promise<void> {
  for (const card of cards) {
    // Upsert: insert or update if exists
    await db.query(
      `INSERT INTO pokemon_cards (id, name, hp, types, set_id, ...)
       VALUES ($1, $2, $3, $4, $5, ...)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         hp = EXCLUDED.hp,
         updated_at = NOW()`,
      [card.id, card.name, card.hp, card.types, card.set_id, ...]
    );
  }
}
```

## Common Patterns

### Energy Type Constants

```typescript
const ENERGY_TYPES = [
  'Grass',
  'Fire',
  'Water',
  'Lightning',
  'Psychic',
  'Fighting',
  'Darkness',
  'Metal',
  'Fairy',
  'Dragon',
  'Colorless'
] as const;

type EnergyType = typeof ENERGY_TYPES[number];
```

### Rarity Constants

```typescript
const RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Rare Holo',
  'Rare Holo EX',
  'Rare Holo GX',
  'Rare Holo V',
  'Rare Holo VMAX',
  'Rare Ultra',
  'Rare Secret',
  'Promo'
] as const;

type Rarity = typeof RARITIES[number];
```

## Best Practices

- Always validate card data before database insertion
- Use proper TypeScript types from @pokemon/pokemon-data
- Handle missing optional fields gracefully
- Cache frequently accessed data (sets, card lists)
- Index database columns used in search queries
- Normalize card names for better search results
- Track data source and last updated timestamp
- Version control card data schemas
- Document data transformation logic
- Test validation rules thoroughly
