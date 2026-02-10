import { renderReactApplication } from './web/utils/render';
import {
  handleStaticFileRequest,
  isRequestForStaticFile
} from './renderStaticFile';

/**
 * Handle web requests (static files and React SSR)
 * API requests are proxied at the server level before reaching this handler
 */
export async function handleRequest(request: Request) {
  const url = new URL(request.url);

  if (await isRequestForStaticFile(request)) {
    console.warn('Request was for static file at path %s', url.pathname);
    return handleStaticFileRequest(request);
  }

  return renderReactApplication(request);
}
