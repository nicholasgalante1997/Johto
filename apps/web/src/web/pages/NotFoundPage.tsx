import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import './pages.css';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="page not-found-page">
      <div className="not-found-page__content">
        <span className="not-found-page__icon">{'\u{1F61E}'}</span>
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div className="not-found-page__actions">
          <Link to={ROUTES.DASHBOARD} className="button button--primary">
            Go to Dashboard
          </Link>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
