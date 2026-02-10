import {
  createBrowserRouter,
  createStaticRouter,
  type StaticHandlerContext
} from 'react-router';

export interface ServerRouterLayerProps {
  router: ReturnType<typeof createStaticRouter>;
  context: StaticHandlerContext;
}

export interface BrowserRouterLayerProps {
  router: ReturnType<typeof createBrowserRouter>;
}

export interface RouterLayerProps {
  server?: ServerRouterLayerProps;
  browser?: BrowserRouterLayerProps;
  javascriptRuntime?: 'browser' | 'server';
}
