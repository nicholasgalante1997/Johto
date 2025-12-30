CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS pokemon_card_sets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    series TEXT NOT NULL,
    printed_total INTEGER,
    total INTEGER,
    legalities JSONB,
    ptcgo_code TEXT,
    release_date DATE,
    updated_at TIMESTAMP,
    images JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pokemon_cards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    supertype TEXT NOT NULL,
    subtypes TEXT[] NOT NULL,
    hp INTEGER,
    types TEXT[] NOT NULL,
    evolves_from TEXT[],
    evolves_to TEXT[],
    rules TEXT[],
    abilities JSONB,
    attacks JSONB,
    weaknesses JSONB,
    retreat_cost JSONB,
    converted_retreat_cost INTEGER,
    set_id TEXT NOT NULL REFERENCES pokemon_card_sets(id),
    number TEXT NOT NULL,
    artist TEXT,
    rarity TEXT,
    flavor_text TEXT,
    national_pokedex_numbers JSONB,
    legalities JSONB,
    images JSONB,
    tcgplayer_url TEXT,
    tcgplayer_updated_at DATE,
    tcgplayer_prices JSONB,
    cardmarket_url TEXT,
    cardmarket_updated_at DATE,
    cardmarket_prices JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for foreign keys
CREATE INDEX idx_pokemon_cards_set_id ON pokemon_cards(set_id);

-- Create triggers for updated_at
-- determine if these are necessary

-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER set_updated_at_users
-- BEFORE UPDATE ON users
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER set_updated_at_card_sets
-- BEFORE UPDATE ON pokemon_card_sets
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER set_updated_at_cards
-- BEFORE UPDATE ON pokemon_cards
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();