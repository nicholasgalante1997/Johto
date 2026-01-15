import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar } from './Sidebar';
import type { NavItem } from './types';
import './Sidebar.css';

const mockItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: '📊', count: undefined },
  { id: 'collection', label: 'My Collection', icon: '📦', count: 152 },
  { id: 'decks', label: 'My Decks', icon: '🎴', count: 5 },
  { id: 'wishlist', label: 'Wishlist', icon: '⭐', count: 23 },
  { id: 'trades', label: 'Trades', icon: '🔄', count: 3 },
  { id: 'browse', label: 'Browse Cards', icon: '🔍' },
  { id: 'sets', label: 'Sets', icon: '📚' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const meta: Meta<typeof Sidebar> = {
  title: 'Dashboard/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  argTypes: {
    collapsed: {
      control: 'boolean',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', display: 'flex' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  args: {
    items: mockItems,
    activeItemId: 'collection',
  },
};

export const Collapsed: Story = {
  args: {
    items: mockItems,
    activeItemId: 'collection',
    collapsed: true,
  },
};

export const WithToggle: Story = {
  args: {
    items: mockItems,
    activeItemId: 'decks',
    onToggleCollapse: () => {
      console.log('Toggle collapse');
    },
  },
};

export const NoActivePage: Story = {
  args: {
    items: mockItems,
  },
};

export const WithClickHandler: Story = {
  args: {
    items: mockItems,
    activeItemId: 'overview',
    onItemClick: (item) => {
      console.log('Clicked:', item.label);
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [activeId, setActiveId] = React.useState('collection');
    const [collapsed, setCollapsed] = React.useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ padding: '1rem', backgroundColor: '#F7FAFC', borderRadius: '8px' }}>
          <strong>Active Page:</strong> {mockItems.find((item) => item.id === activeId)?.label}
          <br />
          <strong>Collapsed:</strong> {collapsed ? 'Yes' : 'No'}
        </div>
        <div style={{ height: '600px', display: 'flex' }}>
          <Sidebar
            items={mockItems}
            activeItemId={activeId}
            onItemClick={(item) => setActiveId(item.id)}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />
          <div style={{ flex: 1, padding: '2rem' }}>
            <h1>Main Content Area</h1>
            <p>Click sidebar items to change the active page.</p>
          </div>
        </div>
      </div>
    );
  },
};
