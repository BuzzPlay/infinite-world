import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { ApiError } from '../shared/errors.js';
import { mediaAssetPath } from '../storage/paths.js';

export function registerMediaRoutes(app: FastifyInstance) {
  app.get<{ Params: { mediaId: string } }>('/api/media/:mediaId', async (request, reply) => {
    const mediaId = request.params.mediaId;
    if (!/^[a-f0-9]{32}$/.test(mediaId)) {
      throw new ApiError(404, 'not_found', `media asset ${mediaId} does not exist`);
    }

    let size: number;
    try {
      size = (await stat(mediaAssetPath(config.dataDir, mediaId))).size;
    } catch {
      throw new ApiError(404, 'not_found', `media asset ${mediaId} does not exist`);
    }

    const range = request.headers.range;
    reply.header('accept-ranges', 'bytes').type('video/mp4');
    if (!range)
      return reply
        .header('content-length', size)
        .send(createReadStream(mediaAssetPath(config.dataDir, mediaId)));

    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return reply.code(416).header('content-range', `bytes */${size}`).send();
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      start > end ||
      start >= size
    ) {
      return reply.code(416).header('content-range', `bytes */${size}`).send();
    }
    return reply
      .code(206)
      .header('content-length', end - start + 1)
      .header('content-range', `bytes ${start}-${end}/${size}`)
      .send(createReadStream(mediaAssetPath(config.dataDir, mediaId), { start, end }));
  });
}
