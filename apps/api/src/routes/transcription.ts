import type { FastifyInstance } from 'fastify';

import type { TranscriptionService } from '../services/transcription-service.js';

interface TranscriptionQuery {
  language?: string;
}

export function registerTranscriptionRoutes(
  app: FastifyInstance,
  transcription: TranscriptionService,
) {
  app.post<{ Querystring: TranscriptionQuery }>('/api/transcription', async (request) => {
    const language = request.query.language === 'en' ? 'en' : 'zh';
    const audio = Buffer.isBuffer(request.body) ? request.body : Buffer.from([]);
    const text = await transcription.transcribe(audio, language);
    return { text };
  });
}
