import type { FastifyInstance } from 'fastify';

import { RunManager } from '../runtime/run-manager.js';
import { RunService } from '../services/run-service.js';
import { ApiError } from '../shared/errors.js';
import { publicRun } from '../domain/run.js';
import type { RunConfigInput, RunStartInput } from '../types.js';

type RunParams = { worldId: string };

export function registerRunRoutes(app: FastifyInstance, runs: RunService, manager: RunManager) {
  app.get<{ Params: RunParams }>('/api/worlds/:worldId/run', async (request) => {
    const run = runs.get(request.params.worldId);
    if (!run) throw new ApiError(404, 'not_found', 'no run exists');
    return { run: publicRun(run) };
  });

  app.get<{ Params: RunParams }>('/api/worlds/:worldId/run/metrics', async (request) => manager.metrics(request.params.worldId));

  app.post<{ Params: RunParams; Body: RunStartInput }>('/api/worlds/:worldId/run/start', async (request) => ({ run: publicRun(manager.start(request.params.worldId, request.body ?? {})) }));
  app.post<{ Params: RunParams }>('/api/worlds/:worldId/run/stop', async (request) => ({ run: publicRun(manager.stop(request.params.worldId)) }));
  app.post<{ Params: RunParams }>('/api/worlds/:worldId/run/restart', async (request) => ({ run: publicRun(manager.restart(request.params.worldId)) }));
  app.post<{ Params: RunParams; Body: { optionId: string } }>('/api/worlds/:worldId/run/choice', async (request) => ({ run: publicRun(manager.choose(request.params.worldId, request.body?.optionId)) }));
  app.patch<{ Params: RunParams; Body: RunConfigInput }>('/api/worlds/:worldId/run/config', async (request) => ({ run: publicRun(manager.updateConfig(request.params.worldId, request.body ?? {})) }));

  app.get<{ Params: RunParams }>('/api/worlds/:worldId/run/metrics/ws', { websocket: true }, (socket, request) => {
    const worldId = request.params.worldId;
    const send = () => {
      try {
        socket.send(JSON.stringify(manager.metrics(worldId)));
      } catch {
        // The browser may close between the timer and send.
      }
    };
    const timer = setInterval(send, 1_000);
    socket.on('close', () => clearInterval(timer));
    send();
  });
}
