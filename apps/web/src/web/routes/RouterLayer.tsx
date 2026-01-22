import React from 'react';
import { RouterProvider, StaticRouterProvider } from 'react-router';

import { pipeline } from '@/utils/pipeline';

import MissingBrowserRouterLayerPropsError from './errors/MissingBrowserRouterLayerProps';
import MissingServerRouterLayerPropsError from './errors/MissingServerRouterLayerProps';
import { type RouterLayerProps } from './types';

function RouterLayer({ browser, javascriptRuntime, server }: RouterLayerProps) {
  if (javascriptRuntime === 'server') {
    if (!server) {
      throw new MissingServerRouterLayerPropsError();
    }

    const { context, router } = server;

    return <StaticRouterProvider context={context} router={router} />;
  }

  if (!browser) {
    throw new MissingBrowserRouterLayerPropsError();
  }

  const { router } = browser;

  return <RouterProvider router={router} />;
}

export default pipeline(React.memo)(RouterLayer) as React.MemoExoticComponent<
  typeof RouterLayer
>;

export { type RouterLayerProps };
