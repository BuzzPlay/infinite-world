import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import Fastify from 'fastify';

import { config } from './config.js';
import { EventHub } from './events.js';
import { registerEventRoutes } from './routes/events.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerMediaRoutes } from './routes/media.js';
import { registerRunRoutes } from './routes/runs.js';
import { registerSettingsRoutes } from './routes/settings.js';
import { registerWebRtcRoutes } from './routes/webrtc.js';
import { registerWorldRoutes } from './routes/worlds.js';
import { RunManager } from './runtime/run-manager.js';
import { RuntimeState } from './runtime/state.js';
import { RunService } from './services/run-service.js';
import { SettingsService } from './services/settings-service.js';
import { WorldService } from './services/world-service.js';
import { ApiError } from './shared/errors.js';

interface BuildAppOptions {
  corsOrigins?: readonly string[];
  state?: RuntimeState;
}

export function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({ logger: Boolean(process.env.INFINITE_WORLD_LOG_LEVEL) });
  const state = options.state ?? new RuntimeState();
  const corsOrigins = options.corsOrigins ?? config.corsOrigins;
  const events = new EventHub();
  const worlds = new WorldService(state);
  const runs = new RunService(state);
  const settings = new SettingsService(state);
  const manager = new RunManager(state, runs, events);

  app.register(cors, {
    origin: [...corsOrigins],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.register(websocket);
  app.register(async (routes) => {
    registerHealthRoutes(routes);
    registerWorldRoutes(routes, worlds, manager, state, events);
    registerRunRoutes(routes, runs, manager);
    registerWebRtcRoutes(routes);
    registerSettingsRoutes(routes, settings);
    registerEventRoutes(routes, state, events, corsOrigins);
    registerMediaRoutes(routes);
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ApiError) {
      return reply
        .status(error.statusCode)
        .send({ error: { code: error.code, message: error.message } });
    }
    app.log.error(error);
    return reply
      .status(500)
      .send({ error: { code: 'internal_error', message: 'The API request failed' } });
  });
  return app;
}
