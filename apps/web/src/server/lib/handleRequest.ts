import { renderReactApplication } from './web/utils/render';
import {
  handleStaticFileRequest,
  isRequestForStaticFile
} from './renderStaticFile';
import { handleApiRequest } from './api';
import { isApiRoute } from './routes';

export async function handleRequest(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Check if this is an API request
  if (isApiRoute(path)) {
    return handleApiRequest(request);
  }

  if (await isRequestForStaticFile(request)) {
    console.warn('Request was for static file at path %s', url.pathname);
    return handleStaticFileRequest(request);
  }

  return renderReactApplication(request);
}
