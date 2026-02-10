import type { Preview } from '@storybook/react-webpack5';
import React from 'react';
import { ThemeProvider } from '../src/web/contexts/Theme';

// Import global styles
import '../public/css/index.css';
// Import page-level styles
import '../public/css/pages.css';
// Import default theme (Mocha)
import '../public/css/themes/catppuccin-mocha.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    backgrounds: {
      default: 'catppuccin-mocha',
      values: [
        { name: 'catppuccin-mocha', value: '#11111b' },
        { name: 'catppuccin-macchiato', value: '#181926' },
        { name: 'catppuccin-frappe', value: '#232634' },
        { name: 'catppuccin-latte', value: '#eff1f5' }
      ]
    }
  },
  decorators: [
    (Story) => (
      React.createElement(ThemeProvider, { defaultFlavor: 'mocha' },
        React.createElement(Story)
      )
    )
  ]
};

export default preview;
