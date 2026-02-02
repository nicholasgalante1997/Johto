import React from 'react';
import { Layers, Library } from 'lucide-react';
import { ROUTES } from '@/web/routes';
import { useCollection } from '@/web/contexts/Collection';
import { useDecks } from '@/web/contexts/Deck';
import './Navbar.css';

// Get current pathname safely for SSR
function getPathname(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname;
}

export function Navbar() {
  const { uniqueCards } = useCollection();
  const { deckCount } = useDecks();
  const pathname = getPathname();

  const isActive = (path: string) => {
    if (path === ROUTES.DECKS) {
      return pathname === '/' || pathname.startsWith('/decks');
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <a href="/" className="navbar__logo">
          <span className="navbar__logo-text">Pokemon TCG</span>
        </a>

        <div className="navbar__links">
          <a
            href={ROUTES.DECKS}
            className={`navbar__link ${isActive(ROUTES.DECKS) ? 'navbar__link--active' : ''}`}
          >
            <Layers size={18} />
            <span>Decks</span>
            {deckCount > 0 && (
              <span className="navbar__badge">{deckCount}</span>
            )}
          </a>
          <a
            href={ROUTES.COLLECTION}
            className={`navbar__link ${isActive(ROUTES.COLLECTION) ? 'navbar__link--active' : ''}`}
          >
            <Library size={18} />
            <span>Collection</span>
            {uniqueCards > 0 && (
              <span className="navbar__badge">{uniqueCards}</span>
            )}
          </a>
        </div>
      </div>
    </nav>
  );
}
