import React, { useState } from 'react';
import type { SearchBarProps, SearchFilters } from './types';
import { Button } from '../Button';
import './SearchBar.css';

const POKEMON_TYPES = [
  'Colorless',
  'Darkness',
  'Dragon',
  'Fairy',
  'Fighting',
  'Fire',
  'Grass',
  'Lightning',
  'Metal',
  'Psychic',
  'Water',
];

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Ultra', 'Rare Secret'];

export function SearchBar({
  onSearch,
  placeholder = 'Search Pokemon cards...',
  showFilters = true,
  loading = false,
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [rarity, setRarity] = useState('');
  const [set, setSet] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      query,
      type: type || undefined,
      rarity: rarity || undefined,
      set: set || undefined,
    });
  };

  const handleClear = () => {
    setQuery('');
    setType('');
    setRarity('');
    setSet('');
    onSearch({ query: '' });
  };

  const hasActiveFilters = type || rarity || set;

  const classNames = ['pokemon-search-bar', className].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      <form onSubmit={handleSubmit} className="pokemon-search-bar__form">
        <div className="pokemon-search-bar__input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pokemon-search-bar__input"
            disabled={loading}
          />
          <div className="pokemon-search-bar__actions">
            {(query || hasActiveFilters) && (
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </Button>
            )}
            <Button type="submit" variant="primary" size="medium" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="pokemon-search-bar__filter-section">
            <button
              type="button"
              className="pokemon-search-bar__filter-toggle"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
            >
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="pokemon-search-bar__filter-badge">
                  {[type, rarity, set].filter(Boolean).length}
                </span>
              )}
              <span className={`pokemon-search-bar__filter-icon ${filtersExpanded ? 'expanded' : ''}`}>
                ▼
              </span>
            </button>

            {filtersExpanded && (
              <div className="pokemon-search-bar__filters">
                <div className="pokemon-search-bar__filter">
                  <label htmlFor="type-filter">Type</label>
                  <select
                    id="type-filter"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="pokemon-search-bar__select"
                    disabled={loading}
                  >
                    <option value="">All Types</option>
                    {POKEMON_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pokemon-search-bar__filter">
                  <label htmlFor="rarity-filter">Rarity</label>
                  <select
                    id="rarity-filter"
                    value={rarity}
                    onChange={(e) => setRarity(e.target.value)}
                    className="pokemon-search-bar__select"
                    disabled={loading}
                  >
                    <option value="">All Rarities</option>
                    {RARITIES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pokemon-search-bar__filter">
                  <label htmlFor="set-filter">Set</label>
                  <input
                    type="text"
                    id="set-filter"
                    value={set}
                    onChange={(e) => setSet(e.target.value)}
                    placeholder="e.g., Base Set"
                    className="pokemon-search-bar__select"
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
