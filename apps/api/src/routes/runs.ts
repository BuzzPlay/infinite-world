import type {
  ChooseSceneOptionRequest,
  SubmitInteractionRequest,
} from '@infinite-world/api-contract';
import type { FastifyInstance } from 'fastify';
import { publicRun } from '../domain/run.js';
import type { RunManager } from '../runtime/run-manager.js';
import type { RunService } from '../services/run-service.js';
import { ApiError } from '../shared/errors.js';
import type { RunConfigInput, RunStartInput } from '../types.js';

type RunParams = { worldId: string };
type SceneParams = RunParams & { sceneId: string };
type VersionParams = RunParams & { versionId: string };

export function registerRunRoutes(app: FastifyInstance, runs: RunService, manager: RunManager) {
  app.get<{ Params: RunParams }>('/api/worlds/:worldId/run', async (request) => {
    const run = runs.get(request.params.worldId);
    if (!run) throw new ApiError(404, 'not_found', 'no run exists');
    return { run: publicRun(run) };
  });

  app.get<{ Params: RunParams }>('/api/worlds/:worldId/run/metrics', async (request) =>
    manager.metrics(request.params.worldId),
  );

  app.post<{ Params: RunParams; Body: RunStartInput }>(
    '/api/worlds/:worldId/run/start',
    async (request) => ({
      run: publicRun(manager.start(request.params.worldId, request.body ?? {})),
    }),
  );
  app.post<{ Params: RunParams }>('/api/worlds/:worldId/run/stop', async (request) => ({
    run: publicRun(manager.stop(request.params.worldId)),
  }));
  app.post<{ Params: RunParams }>('/api/worlds/:worldId/run/restart', async (request) => ({
    run: publicRun(manager.restart(request.params.worldId)),
  }));
  app.post<{ Params: RunParams; Body: ChooseSceneOptionRequest }>(
    '/api/worlds/:worldId/run/choice',
    async (request) => ({
      run: publicRun(
        manager.choose(request.params.worldId, request.body?.optionId, request.body?.sceneId),
      ),
    }),
  );
  app.post<{ Params: RunParams; Body: SubmitInteractionRequest }>(
    '/api/worlds/:worldId/run/input',
    async (request) => ({
      run: publicRun(
        manager.chooseInput(
          request.params.worldId,
          request.body?.input ?? '',
          request.body?.sceneId,
        ),
      ),
    }),
  );
  app.post<{ Params: SceneParams }>(
    '/api/worlds/:worldId/run/scenes/:sceneId/activate',
    async (request) => ({
      run: publicRun(manager.activateScene(request.params.worldId, request.params.sceneId)),
    }),
  );
  app.patch<{ Params: RunParams; Body: RunConfigInput }>(
    '/api/worlds/:worldId/run/config',
    async (request) => ({
      run: publicRun(manager.updateConfig(request.params.worldId, request.body ?? {})),
    }),
  );

  app.delete<{ Params: SceneParams }>(
    '/api/worlds/:worldId/run/scenes/:sceneId',
    async (request) => ({
      run: publicRun(manager.deleteSceneBranch(request.params.worldId, request.params.sceneId)),
    }),
  );

  app.delete<{ Params: VersionParams }>(
    '/api/worlds/:worldId/run/versions/:versionId',
    async (request) => ({
      run: publicRun(manager.deleteRunVersion(request.params.worldId, request.params.versionId)),
    }),
  );

  app.post<{ Params: SceneParams }>(
    '/api/worlds/:worldId/run/scenes/:sceneId/options',
    async (request) => ({
      run: publicRun(
        await manager.regenerateSceneOptions(request.params.worldId, request.params.sceneId),
      ),
    }),
  );
}
