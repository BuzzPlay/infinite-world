import type { FastifyInstance } from 'fastify';

import { type EventHub, writeSse } from '../events.js';
import type { RuntimeState } from '../runtime/state.js';
import { corsResponseHeaders } from '../shared/cors.js';

export function registerEventRoutes(
  app: FastifyInstance,
  state: RuntimeState,
  events: EventHub,
  corsOrigins: readonly string[],
) {
  app.get('/api/events', async (request, reply) => {
    reply.hijack();
    reply.raw.writeHead(200, {
      ...corsResponseHeaders(request.headers.origin, corsOrigins),
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',
    });
    writeSse(reply.raw, events.snapshot(state));
    const unsubscribe = events.subscribe((event) => writeSse(reply.raw, event));
    request.raw.on('close', unsubscribe);
  });
}
