import { renderWebApp } from './web/utils/render';
import {
  handleStaticFileRequest,
  isRequestForStaticFile
} from './renderStaticFile';
import { handleApiRequest } from './api';
import { isApiRoute, isWebRoute } from './routes';

export async function handleRequest(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Check if this is an API request
  if (isApiRoute(path)) {
    return handleApiRequest(request);
  }

  // Check for static files first (CSS, JS, images, etc.)
  if (await isRequestForStaticFile(request)) {
    return handleStaticFileRequest(request);
  }

  // Check if this is a web route (render React app)
  if (isWebRoute(path)) {
    return renderWebApp(request);
  }

  // For unknown routes, let React Router handle 404
  // This enables client-side 404 handling
  return renderWebApp(request);
}
