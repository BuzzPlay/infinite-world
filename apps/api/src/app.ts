import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import Fastify from 'fastify';

import { EventHub } from './events.js';
import { RunManager } from './runtime/run-manager.js';
import { registerEventRoutes } from './routes/events.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerMediaRoutes } from './routes/media.js';
import { registerRunRoutes } from './routes/runs.js';
import { registerSettingsRoutes } from './routes/settings.js';
import { registerWebRtcRoutes } from './routes/webrtc.js';
import { registerWorldRoutes } from './routes/worlds.js';
import { RuntimeState } from './runtime/state.js';
import { RunService } from './services/run-service.js';
import { SettingsService } from './services/settings-service.js';
import { WorldService } from './services/world-service.js';
import { ApiError } from './shared/errors.js';

export function buildApp() {
  const app = Fastify({ logger: process.env.INFINITE_WORLD_LOG_LEVEL ? true : false });
  const state = new RuntimeState();
  const events = new EventHub();
  const worlds = new WorldService(state);
  const runs = new RunService(state);
  const settings = new SettingsService(state);
  const manager = new RunManager(state, runs, events);

  app.register(cors, { origin: true });
  app.register(websocket);
  registerHealthRoutes(app);
  registerWorldRoutes(app, worlds, state, events);
  registerRunRoutes(app, runs, manager);
  registerWebRtcRoutes(app);
  registerSettingsRoutes(app, settings);
  registerEventRoutes(app, state, events);
  registerMediaRoutes(app);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message } });
    }
    app.log.error(error);
    return reply.status(500).send({ error: { code: 'internal_error', message: 'The API request failed' } });
  });
  return app;
}
