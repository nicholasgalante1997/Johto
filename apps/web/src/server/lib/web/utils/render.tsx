import React from 'react';
import { renderToReadableStream, renderToString } from 'react-dom/server.bun';
import { StaticRouter } from 'react-router';

import { getBrowserJavascriptBundle } from './fs';

import App from '../../../../web/App';
import ServerErrorPage from '../../../../web/pages/ServerErrorPage';

export async function renderWebApp(request: Request) {
  const url = new URL(request.url);
  const location = url.pathname + url.search;

  const bundle = await getBrowserJavascriptBundle();
  if (!bundle) {
    return new Response(
      renderToString(
        <ServerErrorPage error={new Error('Missing Web Assets')} />
      ),
      {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }

  try {
    const stream = await renderToReadableStream(
      <StaticRouter location={location}>
        <App />
      </StaticRouter>,
      {
        bootstrapScriptContent: `window.__INITIAL_STATE__ = ${JSON.stringify({})}`,
        bootstrapModules: [bundle],
        onError(error: unknown) {
          console.error('SSR Render Error (during stream):', error);
        }
      }
    );

    console.log('Stream created successfully for:', location);

    return new Response(stream, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    console.error('SSR Shell Error (before stream):', error);
    return new Response(
      renderToString(
        <ServerErrorPage error={error instanceof Error ? error : new Error(String(error))} />
      ),
      {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}
