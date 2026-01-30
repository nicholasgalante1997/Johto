import type { Meta, StoryObj } from '@storybook/react';
import { ThemeSwitcher } from './ThemeSwitcher';

const meta: Meta<typeof ThemeSwitcher> = {
  title: 'Components/ThemeSwitcher',
  component: ThemeSwitcher,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['dropdown', 'buttons', 'compact']
    },
    showLabels: {
      control: 'boolean'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Dropdown: Story = {
  args: {
    variant: 'dropdown',
    showLabels: true
  }
};

export const Buttons: Story = {
  args: {
    variant: 'buttons',
    showLabels: true
  }
};

export const Compact: Story = {
  args: {
    variant: 'compact',
    showLabels: false
  }
};

export const DropdownNoLabel: Story = {
  args: {
    variant: 'dropdown',
    showLabels: false
  }
};

export const ButtonsNoLabel: Story = {
  args: {
    variant: 'buttons',
    showLabels: false
  }
};
