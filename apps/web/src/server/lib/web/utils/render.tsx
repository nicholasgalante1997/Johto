import React from 'react';
import { renderToReadableStream, renderToString } from 'react-dom/server';

import { getBrowserJavascriptBundle } from './fs';

import App from '../../../../web/App';
import ServerErrorPage from '../../../../web/pages/ServerErrorPage';

export async function renderWebApp() {
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

  const stream = await renderToReadableStream(<App />, {
    bootstrapScriptContent: `window.__INITIAL_STATE__ = ${JSON.stringify({})}`,
    bootstrapModules: [bundle]
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
