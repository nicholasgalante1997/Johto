import { type Meta, type StoryObj } from '@storybook/react';
import Header from './Header';

const meta = {
  title: 'Example/Header',
  component: Header
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Header {...args} />
};
