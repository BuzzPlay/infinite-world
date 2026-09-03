import type { FastifyInstance } from 'fastify';
import type { WorldConfig } from '@infinite-world/api-contract';

import type { EventHub } from '../events.js';
import type { RuntimeState } from '../runtime/state.js';
import type { WorldService } from '../services/world-service.js';
import { ApiError } from '../shared/errors.js';

type WorldParams = { worldId: string };

export function registerWorldRoutes(
  app: FastifyInstance,
  worlds: WorldService,
  state: RuntimeState,
  events: EventHub,
) {
  app.get('/api/worlds', async (_request, reply) => {
    const response = worlds.current();
    if (!response) throw new ApiError(404, 'not_found', 'no world has been created');
    return reply.send(response);
  });

  app.get('/api/worlds/list', async () => worlds.list());

  app.post<{ Body: { world: WorldConfig } }>('/api/worlds', async (request, reply) => {
    const response = worlds.create(request.body?.world);
    events.publish(events.snapshot(state));
    return reply.send(response);
  });

  app.put<{ Params: WorldParams; Body: { world: WorldConfig } }>(
    '/api/worlds/:worldId',
    async (request) => {
      const response = worlds.update(request.params.worldId, request.body?.world);
      events.publish(events.snapshot(state));
      return response;
    },
  );

  app.post<{ Params: WorldParams }>('/api/worlds/:worldId/select', async (request) => {
    const response = worlds.select(request.params.worldId);
    events.publish(events.snapshot(state));
    return response;
  });
}
