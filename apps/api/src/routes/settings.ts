import type { FastifyInstance } from 'fastify';

import { SettingsService } from '../services/settings-service.js';

export function registerSettingsRoutes(app: FastifyInstance, settings: SettingsService) {
  app.get('/api/settings/providers', async () => settings.providers());
  app.put<{ Body: Record<string, unknown> }>('/api/settings/providers', async (request) => settings.update(request.body ?? {}));
}
