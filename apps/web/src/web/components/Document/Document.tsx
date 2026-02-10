import React, { useEffect } from 'react';

import { type DocumentProps } from './Document.types';

function Document(props: DocumentProps) {
  useEffect(() => console.log('Mounted on the client'), []);
  return (
    <html lang="en">
      <head>
        <title>{props.title}</title>
        <meta name="description" content={props.description} />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <base href="/" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* Minimal CSS reset - no external font dependencies */}
        <link rel="stylesheet" href="/css/index.css" />
        {/* Page-level styles for all routes */}
        <link rel="stylesheet" href="/css/pages.css" />
        {/* Default Catppuccin theme - will be swapped by ThemeProvider on client */}
        <link
          id="catppuccin-theme"
          rel="stylesheet"
          href="/css/themes/catppuccin-mocha.css"
        />
      </head>
      <body>
        <main>{props.children}</main>
      </body>
    </html>
  );
}

export default Document;
