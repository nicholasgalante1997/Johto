import { Document } from '../components/Document';

interface Props {
  error?: Error | string;
}

function ServerErrorPage({ error }: Props) {
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || 'An unexpected error occurred';
  const errorStack =
    typeof error === 'object' && error instanceof Error
      ? error.stack
      : undefined;

  return (
    <Document title="Error" description="An error occurred">
      <div className="container">
        <article style={{ marginTop: '2rem' }}>
          <header>
            <h1>Oops! Something went wrong</h1>
          </header>
          <p>{errorMessage}</p>
          {errorStack && (
            <details>
              <summary>Stack trace</summary>
              <pre style={{ fontSize: '0.875rem', overflow: 'auto' }}>
                <code>{errorStack}</code>
              </pre>
            </details>
          )}
          <footer>
            <a href="/" role="button">
              Go back home
            </a>
          </footer>
        </article>
      </div>
    </Document>
  );
}

export default ServerErrorPage;
