import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  Package,
  Layers,
  Star,
  DollarSign,
  BarChart3,
  CheckCircle,
  Zap,
  Flame,
  Heart,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { Stats } from './Stats';
import type { StatItem } from './types';
import './Stats.css';

const mockStats: StatItem[] = [
  {
    id: 'total-cards',
    label: 'Total Cards',
    value: '152',
    icon: <Package size={20} />,
    trend: 'up',
    trendValue: '+12',
    color: 'blue'
  },
  {
    id: 'total-decks',
    label: 'Active Decks',
    value: '5',
    icon: <Layers size={20} />,
    trend: 'neutral',
    trendValue: '0',
    color: 'green'
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    value: '23',
    icon: <Star size={20} />,
    trend: 'up',
    trendValue: '+5',
    color: 'yellow'
  },
  {
    id: 'collection-value',
    label: 'Est. Value',
    value: '$1,247',
    icon: <DollarSign size={20} />,
    trend: 'up',
    trendValue: '+8%',
    color: 'purple'
  }
];

const meta: Meta<typeof Stats> = {
  title: 'Dashboard/Stats',
  component: Stats,
  tags: ['autodocs'],
  argTypes: {
    layout: {
      control: 'select',
      options: ['grid', 'row']
    },
    columns: {
      control: 'select',
      options: [2, 3, 4]
    }
  }
};

export default meta;
type Story = StoryObj<typeof Stats>;

export const Default: Story = {
  args: {
    stats: mockStats
  }
};

export const TwoColumns: Story = {
  args: {
    stats: mockStats,
    columns: 2
  }
};

export const ThreeColumns: Story = {
  args: {
    stats: mockStats,
    columns: 3
  }
};

export const RowLayout: Story = {
  args: {
    stats: mockStats,
    layout: 'row'
  }
};

export const WithoutTrends: Story = {
  args: {
    stats: mockStats.map((stat) => ({
      ...stat,
      trend: undefined,
      trendValue: undefined
    }))
  }
};

export const WithoutIcons: Story = {
  args: {
    stats: mockStats.map((stat) => ({
      ...stat,
      icon: undefined
    }))
  }
};

export const SingleStat: Story = {
  args: {
    stats: [mockStats[0]]
  }
};

export const AllColors: Story = {
  args: {
    stats: [
      {
        id: '1',
        label: 'Blue Stat',
        value: '100',
        icon: <BarChart3 size={20} />,
        color: 'blue'
      },
      {
        id: '2',
        label: 'Green Stat',
        value: '85',
        icon: <CheckCircle size={20} />,
        color: 'green'
      },
      {
        id: '3',
        label: 'Yellow Stat',
        value: '42',
        icon: <Zap size={20} />,
        color: 'yellow'
      },
      {
        id: '4',
        label: 'Red Stat',
        value: '15',
        icon: <Flame size={20} />,
        color: 'red'
      },
      {
        id: '5',
        label: 'Purple Stat',
        value: '67',
        icon: <Heart size={20} />,
        color: 'purple'
      }
    ]
  }
};

export const AllTrends: Story = {
  args: {
    stats: [
      {
        id: '1',
        label: 'Trending Up',
        value: '150',
        icon: <TrendingUp size={20} />,
        trend: 'up',
        trendValue: '+25%',
        color: 'blue'
      },
      {
        id: '2',
        label: 'Trending Down',
        value: '75',
        icon: <TrendingDown size={20} />,
        trend: 'down',
        trendValue: '-10%',
        color: 'red'
      },
      {
        id: '3',
        label: 'No Change',
        value: '100',
        icon: <ArrowRight size={20} />,
        trend: 'neutral',
        trendValue: '0%',
        color: 'green'
      }
    ],
    columns: 3
  }
};
