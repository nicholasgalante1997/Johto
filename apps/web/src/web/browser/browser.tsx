import React from 'react';
import { hydrateRoot } from 'react-dom/client';

import { App } from '../App';
import { createBrowserRouter } from 'react-router';
import { REACT_ROUTER_ROUTES } from '../routes/routes';

hydrateRoot(
  document,
  <main>
    <App
      routes={{
        javascriptRuntime: 'browser',
        browser: { router: createBrowserRouter(REACT_ROUTER_ROUTES) }
      }}
    />
  </main>
);
