import type { Meta, StoryObj } from '@storybook/react';
import { Stats } from './Stats';
import type { StatItem } from './types';
import './Stats.css';

const mockStats: StatItem[] = [
  {
    id: 'total-cards',
    label: 'Total Cards',
    value: '152',
    icon: '📦',
    trend: 'up',
    trendValue: '+12',
    color: 'blue',
  },
  {
    id: 'total-decks',
    label: 'Active Decks',
    value: '5',
    icon: '🎴',
    trend: 'neutral',
    trendValue: '0',
    color: 'green',
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    value: '23',
    icon: '⭐',
    trend: 'up',
    trendValue: '+5',
    color: 'yellow',
  },
  {
    id: 'collection-value',
    label: 'Est. Value',
    value: '$1,247',
    icon: '💰',
    trend: 'up',
    trendValue: '+8%',
    color: 'purple',
  },
];

const meta: Meta<typeof Stats> = {
  title: 'Dashboard/Stats',
  component: Stats,
  tags: ['autodocs'],
  argTypes: {
    layout: {
      control: 'select',
      options: ['grid', 'row'],
    },
    columns: {
      control: 'select',
      options: [2, 3, 4],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Stats>;

export const Default: Story = {
  args: {
    stats: mockStats,
  },
};

export const TwoColumns: Story = {
  args: {
    stats: mockStats,
    columns: 2,
  },
};

export const ThreeColumns: Story = {
  args: {
    stats: mockStats,
    columns: 3,
  },
};

export const RowLayout: Story = {
  args: {
    stats: mockStats,
    layout: 'row',
  },
};

export const WithoutTrends: Story = {
  args: {
    stats: mockStats.map((stat) => ({
      ...stat,
      trend: undefined,
      trendValue: undefined,
    })),
  },
};

export const WithoutIcons: Story = {
  args: {
    stats: mockStats.map((stat) => ({
      ...stat,
      icon: undefined,
    })),
  },
};

export const SingleStat: Story = {
  args: {
    stats: [mockStats[0]],
  },
};

export const AllColors: Story = {
  args: {
    stats: [
      { id: '1', label: 'Blue Stat', value: '100', icon: '📊', color: 'blue' },
      { id: '2', label: 'Green Stat', value: '85', icon: '✅', color: 'green' },
      { id: '3', label: 'Yellow Stat', value: '42', icon: '⚡', color: 'yellow' },
      { id: '4', label: 'Red Stat', value: '15', icon: '🔥', color: 'red' },
      { id: '5', label: 'Purple Stat', value: '67', icon: '💜', color: 'purple' },
    ],
  },
};

export const AllTrends: Story = {
  args: {
    stats: [
      {
        id: '1',
        label: 'Trending Up',
        value: '150',
        icon: '📈',
        trend: 'up',
        trendValue: '+25%',
        color: 'blue',
      },
      {
        id: '2',
        label: 'Trending Down',
        value: '75',
        icon: '📉',
        trend: 'down',
        trendValue: '-10%',
        color: 'red',
      },
      {
        id: '3',
        label: 'No Change',
        value: '100',
        icon: '➡️',
        trend: 'neutral',
        trendValue: '0%',
        color: 'green',
      },
    ],
    columns: 3,
  },
};
