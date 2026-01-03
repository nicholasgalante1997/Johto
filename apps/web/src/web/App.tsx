import React from 'react';

import Document from './components/Document/Document';

function App() {
  return (
    <React.StrictMode>
      <Document description="Bun test" title="Bun Test">
        <section>
          <p>Hello Bun + React</p>
        </section>
      </Document>
    </React.StrictMode>
  );
}

export default App;
