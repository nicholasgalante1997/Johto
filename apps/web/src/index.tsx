import { get } from 'node-emoji';
import { serve } from './server/server';

const server = await serve();
console.log(
  `Listening on http://localhost:${server.port} ${get('rocket')} ...`
);
