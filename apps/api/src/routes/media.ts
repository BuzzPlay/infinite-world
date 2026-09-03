import type { FastifyInstance } from 'fastify';

import { ApiError } from '../shared/errors.js';

export function registerMediaRoutes(app: FastifyInstance) {
  app.get<{ Params: { mediaId: string } }>('/api/media/:mediaId', async (request) => {
    throw new ApiError(404, 'not_found', `media asset ${request.params.mediaId} does not exist`);
  });
}
