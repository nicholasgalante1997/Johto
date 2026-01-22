import React from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../routes';
import { useCollection } from '../contexts/Collection';
import { useDecks } from '../contexts/Deck';
import { Stats } from '../components/Stats';

function DashboardPage() {
  const { totalCards, uniqueCards } = useCollection();
  const { deckCount, decks } = useDecks();

  // Calculate valid decks (60 cards)
  const validDecks = decks.filter(
    (deck) => deck.cards.reduce((sum, c) => sum + c.quantity, 0) === 60
  ).length;

  return (
    <div className="page dashboard-page">
      <div className="dashboard-page__welcome">
        <h1>Welcome to Pokemon TCG Manager</h1>
        <p>
          Manage your card collection, build decks, and track your progress.
        </p>
      </div>

      {/* Stats Grid */}
      <Stats
        stats={[
          {
            id: 'total-cards',
            label: 'Total Cards',
            value: totalCards,
            icon: '\u{1F4DA}',
            trend: totalCards > 0 ? 'up' : undefined,
            color: 'blue'
          },
          {
            id: 'unique-cards',
            label: 'Unique Cards',
            value: uniqueCards,
            icon: '\u{2728}',
            color: 'purple'
          },
          {
            id: 'decks-created',
            label: 'Decks Created',
            value: deckCount,
            icon: '\u{1F3B4}',
            color: 'yellow'
          },
          {
            id: 'format-ready',
            label: 'Format Ready',
            value: validDecks,
            icon: '\u{2705}',
            color: validDecks > 0 ? 'green' : undefined
          }
        ]}
        columns={4}
      />

      <div className="dashboard-page__quick-actions">
        <h2>Quick Actions</h2>
        <div className="dashboard-page__action-grid">
          <Link to={ROUTES.BROWSE} className="dashboard-page__action-card">
            <span className="dashboard-page__action-icon">{'\u{1F50D}'}</span>
            <h3>Browse Cards</h3>
            <p>Explore all available Pokemon cards</p>
          </Link>

          <Link to={ROUTES.COLLECTION} className="dashboard-page__action-card">
            <span className="dashboard-page__action-icon">{'\u{1F4DA}'}</span>
            <h3>My Collection</h3>
            <p>View and manage your card collection</p>
          </Link>

          <Link to={ROUTES.DECK_NEW} className="dashboard-page__action-card">
            <span className="dashboard-page__action-icon">{'\u{2795}'}</span>
            <h3>Create Deck</h3>
            <p>Build a new competitive deck</p>
          </Link>

          <Link to={ROUTES.DECKS} className="dashboard-page__action-card">
            <span className="dashboard-page__action-icon">{'\u{1F3B4}'}</span>
            <h3>My Decks</h3>
            <p>View and edit your saved decks</p>
          </Link>
        </div>
      </div>

      {/* Recent Decks */}
      {decks.length > 0 && (
        <div className="dashboard-page__recent-decks">
          <h2>Recent Decks</h2>
          <div className="dashboard-page__deck-list">
            {decks.slice(0, 4).map((deck) => (
              <Link
                key={deck.id}
                to={ROUTES.DECK_DETAIL(deck.id)}
                className="dashboard-page__deck-card"
              >
                <h3>{deck.name}</h3>
                <p>
                  {deck.cards.reduce((sum, c) => sum + c.quantity, 0)}/60 cards
                </p>
                <span className="dashboard-page__deck-format">
                  {deck.format}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
