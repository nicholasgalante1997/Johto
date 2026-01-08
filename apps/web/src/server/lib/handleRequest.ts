import { renderWebApp } from './web/utils/render';
import {
  handleStaticFileRequest,
  isRequestForStaticFile
} from './renderStaticFile';
import { handleApiRequest } from './api';

export async function handleRequest(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const searchParams = url.searchParams;

  // Check if this is an API request
  if (path.startsWith('/api/v1/')) {
    return handleApiRequest(request);
  }

  if (['/', '/index.html'].includes(url.pathname)) {
    return renderWebApp();
  }

  if (await isRequestForStaticFile(request)) {
    console.warn('Request was for static file at path %s', url.pathname);
    return handleStaticFileRequest(request);
  }

  return new Response('Not Found', { status: 404 });
}
