export function middleware(request: Request) {
  console.log('Request %s %s', request.method, new URL(request.url).pathname);
}
