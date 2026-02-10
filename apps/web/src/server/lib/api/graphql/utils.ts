export function formatUser(user: any) {
  return {
    id: user.id.toString(),
    username: user.username,
    email: user.email,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

export function formatSet(set: any) {
  return {
    id: set.id,
    name: set.name,
    series: set.series,
    printed_total: set.printed_total,
    total: set.total,
    legalities: set.legalities,
    ptcgo_code: set.ptcgo_code,
    release_date: set.release_date,
    updated_at: set.updated_at,
    images: set.images,
    created_at: set.created_at
  };
}

export function formatCard(card: any) {
  return {
    id: card.id,
    name: card.name,
    supertype: card.supertype,
    subtypes: card.subtypes,
    hp: card.hp,
    types: card.types,
    evolves_from: card.evolves_from,
    evolves_to: card.evolves_to,
    rules: card.rules,
    abilities: card.abilities,
    attacks: card.attacks,
    weaknesses: card.weaknesses,
    retreat_cost: card.retreat_cost,
    converted_retreat_cost: card.converted_retreat_cost,
    set_id: card.set_id,
    number: card.number,
    artist: card.artist,
    rarity: card.rarity,
    flavor_text: card.flavor_text,
    national_pokedex_numbers: card.national_pokedex_numbers,
    legalities: card.legalities,
    images: card.images,
    tcgplayer_url: card.tcgplayer_url,
    cardmarket_url: card.cardmarket_url,
    created_at: card.created_at,
    updated_at: card.updated_at
  };
}
