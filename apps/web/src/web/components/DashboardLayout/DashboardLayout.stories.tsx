import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  BarChart3,
  Package,
  Layers,
  Star,
  Search,
  Settings,
  DollarSign,
  User
} from 'lucide-react';
import { DashboardLayout } from './DashboardLayout';
import { Sidebar } from '../Sidebar';
import { Stats } from '../Stats';
import { SearchBar } from '../SearchBar';
import { CardGrid } from '../CardGrid';
import type { NavItem } from '../Sidebar/types';
import type { StatItem } from '../Stats/types';
import type { Pokemon } from '@pokemon/clients';
import './DashboardLayout.css';

const mockNavItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={20} /> },
  { id: 'collection', label: 'My Collection', icon: <Package size={20} />, count: 152 },
  { id: 'decks', label: 'My Decks', icon: <Layers size={20} />, count: 5 },
  { id: 'wishlist', label: 'Wishlist', icon: <Star size={20} />, count: 23 },
  { id: 'browse', label: 'Browse Cards', icon: <Search size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
];

const mockStats: StatItem[] = [
  {
    id: '1',
    label: 'Total Cards',
    value: '152',
    icon: <Package size={20} />,
    trend: 'up',
    trendValue: '+12',
    color: 'blue'
  },
  { id: '2', label: 'Active Decks', value: '5', icon: <Layers size={20} />, color: 'green' },
  {
    id: '3',
    label: 'Wishlist',
    value: '23',
    icon: <Star size={20} />,
    trend: 'up',
    trendValue: '+5',
    color: 'yellow'
  },
  {
    id: '4',
    label: 'Est. Value',
    value: '$1,247',
    icon: <DollarSign size={20} />,
    trend: 'up',
    trendValue: '+8%',
    color: 'purple'
  }
];

const mockCards: Pokemon.Card[] = [];

const meta: Meta<typeof DashboardLayout> = {
  title: 'Dashboard/DashboardLayout',
  component: DashboardLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  },
  argTypes: {
    showSidebar: {
      control: 'boolean'
    },
    sidebarCollapsed: {
      control: 'boolean'
    }
  }
};

export default meta;
type Story = StoryObj<typeof DashboardLayout>;

const SampleSidebar = () => (
  <Sidebar items={mockNavItems} activeItemId="overview" />
);

const SampleHeader = () => (
  <div
    style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      padding: '0 2rem',
      justifyContent: 'space-between'
    }}
  >
    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
      Dashboard
    </h1>
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <span style={{ color: '#718096' }}>Welcome back!</span>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #68A0F6 0%, #9F7AEA 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700
        }}
      >
        <User size={20} />
      </div>
    </div>
  </div>
);

export const Default: Story = {
  args: {
    sidebar: <SampleSidebar />,
    children: (
      <div>
        <h2>Dashboard Content</h2>
        <p>Your main content goes here.</p>
      </div>
    )
  }
};

export const WithHeader: Story = {
  args: {
    sidebar: <SampleSidebar />,
    header: <SampleHeader />,
    children: (
      <div>
        <h2>Dashboard Content</h2>
        <p>Layout with header and sidebar.</p>
      </div>
    )
  }
};

export const NoSidebar: Story = {
  args: {
    showSidebar: false,
    header: <SampleHeader />,
    children: (
      <div>
        <h2>Full Width Content</h2>
        <p>Layout without sidebar.</p>
      </div>
    )
  }
};

export const CollapsedSidebar: Story = {
  args: {
    sidebar: <Sidebar items={mockNavItems} activeItemId="overview" collapsed />,
    sidebarCollapsed: true,
    children: (
      <div>
        <h2>Dashboard Content</h2>
        <p>Layout with collapsed sidebar.</p>
      </div>
    )
  }
};

export const FullDashboard: Story = {
  args: {
    sidebar: <SampleSidebar />,
    header: <SampleHeader />,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <Stats stats={mockStats} />
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Browse Cards</h2>
          <SearchBar onSearch={(filters) => console.log('Search:', filters)} />
        </div>
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Your Collection</h2>
          <CardGrid
            cards={mockCards}
            emptyMessage="Start adding cards to your collection"
          />
        </div>
      </div>
    )
  }
};

export const Interactive: Story = {
  render: () => {
    const [activePage, setActivePage] = React.useState('overview');
    const [collapsed, setCollapsed] = React.useState(false);

    return (
      <DashboardLayout
        sidebar={
          <Sidebar
            items={mockNavItems}
            activeItemId={activePage}
            onItemClick={(item) => setActivePage(item.id)}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />
        }
        header={<SampleHeader />}
        sidebarCollapsed={collapsed}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #E2E8F0'
            }}
          >
            <strong>Current Page:</strong>{' '}
            {mockNavItems.find((item) => item.id === activePage)?.label}
            <br />
            <strong>Sidebar:</strong> {collapsed ? 'Collapsed' : 'Expanded'}
          </div>

          {activePage === 'overview' && (
            <>
              <Stats stats={mockStats} />
              <div>
                <h2>Recent Activity</h2>
                <p>Your recent Pokemon TCG activity will appear here.</p>
              </div>
            </>
          )}

          {activePage === 'collection' && (
            <div>
              <h2>My Collection</h2>
              <SearchBar
                onSearch={(filters) => console.log('Search:', filters)}
              />
              <div style={{ marginTop: '1rem' }}>
                <CardGrid
                  cards={mockCards}
                  emptyMessage="No cards in your collection yet"
                />
              </div>
            </div>
          )}

          {activePage === 'decks' && (
            <div>
              <h2>My Decks</h2>
              <p>Your Pokemon TCG decks will appear here.</p>
            </div>
          )}

          {activePage !== 'overview' &&
            activePage !== 'collection' &&
            activePage !== 'decks' && (
              <div>
                <h2>
                  {mockNavItems.find((item) => item.id === activePage)?.label}
                </h2>
                <p>Content for this page coming soon...</p>
              </div>
            )}
        </div>
      </DashboardLayout>
    );
  }
};
