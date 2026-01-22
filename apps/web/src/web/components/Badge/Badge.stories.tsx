import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';
import './Badge.css';

const meta: Meta<typeof Badge> = {
  title: 'Dashboard/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'type', 'rarity']
    },
    size: {
      control: 'select',
      options: ['small', 'medium']
    }
  }
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Default',
    variant: 'default'
  }
};

export const AllTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      <Badge variant="type" pokemonType="Colorless">
        Colorless
      </Badge>
      <Badge variant="type" pokemonType="Darkness">
        Darkness
      </Badge>
      <Badge variant="type" pokemonType="Dragon">
        Dragon
      </Badge>
      <Badge variant="type" pokemonType="Fairy">
        Fairy
      </Badge>
      <Badge variant="type" pokemonType="Fighting">
        Fighting
      </Badge>
      <Badge variant="type" pokemonType="Fire">
        Fire
      </Badge>
      <Badge variant="type" pokemonType="Grass">
        Grass
      </Badge>
      <Badge variant="type" pokemonType="Lightning">
        Lightning
      </Badge>
      <Badge variant="type" pokemonType="Metal">
        Metal
      </Badge>
      <Badge variant="type" pokemonType="Psychic">
        Psychic
      </Badge>
      <Badge variant="type" pokemonType="Water">
        Water
      </Badge>
    </div>
  )
};

export const AllRarities: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      <Badge variant="rarity" rarity="Common">
        Common
      </Badge>
      <Badge variant="rarity" rarity="Uncommon">
        Uncommon
      </Badge>
      <Badge variant="rarity" rarity="Rare">
        Rare
      </Badge>
      <Badge variant="rarity" rarity="Rare Holo">
        Rare Holo
      </Badge>
      <Badge variant="rarity" rarity="Rare Ultra">
        Rare Ultra
      </Badge>
      <Badge variant="rarity" rarity="Rare Secret">
        Rare Secret
      </Badge>
    </div>
  )
};

export const SmallSize: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      <Badge variant="type" pokemonType="Fire" size="small">
        Fire
      </Badge>
      <Badge variant="type" pokemonType="Water" size="small">
        Water
      </Badge>
      <Badge variant="rarity" rarity="Rare Holo" size="small">
        Rare Holo
      </Badge>
    </div>
  )
};

export const FireType: Story = {
  args: {
    children: 'Fire',
    variant: 'type',
    pokemonType: 'Fire'
  }
};

export const WaterType: Story = {
  args: {
    children: 'Water',
    variant: 'type',
    pokemonType: 'Water'
  }
};

export const RareHolo: Story = {
  args: {
    children: 'Rare Holo',
    variant: 'rarity',
    rarity: 'Rare Holo'
  }
};
