import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import type { Pokemon } from '@pokemon/clients';
import './Card.css';

const mockCard: Pokemon.Card = {
  id: 'base1-4',
  name: 'Charizard',
  supertype: 'Pokémon',
  subtypes: ['Stage 2'],
  hp: '120',
  types: ['Fire'],
  evolvesTo: [],
  rules: [],
  attacks: [
    {
      name: 'Fire Spin',
      cost: ['Fire', 'Fire', 'Fire', 'Fire'],
      convertedEnergyCost: 4,
      damage: '100',
      text: 'Discard 2 Energy attached to Charizard in order to use this attack.',
    },
    {
      name: 'Flamethrower',
      cost: ['Fire', 'Fire'],
      convertedEnergyCost: 2,
      damage: '50',
      text: 'Discard 1 Fire Energy attached to Charizard.',
    },
  ],
  weaknesses: [{ type: 'Water', value: '×2' }],
  resistances: [{ type: 'Fighting', value: '-30' }],
  retreatCost: ['Colorless', 'Colorless', 'Colorless'],
  convertedRetreatCost: 3,
  set: {
    id: 'base1',
    name: 'Base Set',
    series: 'Base',
    printedTotal: 102,
    total: 102,
    releaseDate: '1999/01/09',
    updatedAt: '2020/08/14 09:35:00',
    images: {
      symbol: 'https://images.pokemontcg.io/base1/symbol.png',
      logo: 'https://images.pokemontcg.io/base1/logo.png',
    },
    ptcgoCode: 'BS',
    legalities: {
      unlimited: 'Legal',
    },
  },
  number: 4,
  artist: 'Mitsuhiro Arita',
  rarity: 'Rare Holo',
  nationalPokedexNumbers: ['6'],
  legalities: {
    unlimited: 'Legal',
    expanded: 'Legal',
  },
  images: {
    small: 'https://images.pokemontcg.io/base1/4.png',
    large: 'https://images.pokemontcg.io/base1/4_hires.png',
  },
  tcgplayer: {
    url: 'https://prices.pokemontcg.io/tcgplayer/base1-4',
  },
};

const mockPikachuCard: Pokemon.Card = {
  ...mockCard,
  id: 'base1-58',
  name: 'Pikachu',
  hp: '60',
  types: ['Lightning'],
  subtypes: ['Basic'],
  attacks: [
    {
      name: 'Thunder Shock',
      cost: ['Lightning'],
      convertedEnergyCost: 1,
      damage: '10',
      text: 'Flip a coin. If heads, the Defending Pokémon is now Paralyzed.',
    },
  ],
  number: 58,
  rarity: 'Common',
  images: {
    small: 'https://images.pokemontcg.io/base1/58.png',
    large: 'https://images.pokemontcg.io/base1/58_hires.png',
  },
};

const meta: Meta<typeof Card> = {
  title: 'Dashboard/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['grid', 'list', 'detail'],
    },
    selected: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Grid: Story = {
  args: {
    card: mockCard,
    variant: 'grid',
  },
};

export const List: Story = {
  args: {
    card: mockCard,
    variant: 'list',
  },
};

export const Detail: Story = {
  args: {
    card: mockCard,
    variant: 'detail',
  },
};

export const Selected: Story = {
  args: {
    card: mockCard,
    variant: 'grid',
    selected: true,
  },
};

export const Clickable: Story = {
  args: {
    card: mockCard,
    variant: 'grid',
    onSelect: (card) => {
      console.log('Selected card:', card.name);
    },
  },
};

export const MultipleCards: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
      <Card card={mockCard} variant="grid" />
      <Card card={mockPikachuCard} variant="grid" />
      <Card card={{ ...mockCard, name: 'Blastoise', types: ['Water'], hp: '100' }} variant="grid" />
    </div>
  ),
};

export const ListLayout: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '600px' }}>
      <Card card={mockCard} variant="list" />
      <Card card={mockPikachuCard} variant="list" />
      <Card card={{ ...mockCard, name: 'Blastoise', types: ['Water'] }} variant="list" />
    </div>
  ),
};
