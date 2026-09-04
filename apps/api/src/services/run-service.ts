import type {
  GenerationSettings,
  LiveOutputSettings,
  RunMetricsResponse,
} from '@infinite-world/api-contract';

import {
  applyGenerationInput,
  isHostedGenerationModel,
  isHostedVisionModel,
} from '../domain/generation.js';
import {
  appendScene,
  clone,
  isActive,
  newRun,
  nowIso,
  outputSnapshot,
  touchMetrics,
} from '../domain/run.js';
import { ApiError } from '../shared/errors.js';
import type { RuntimeState } from '../runtime/state.js';
import type { GeneratedScene, RunConfigInput, RunStartInput } from '../types.js';

export class RunService {
  constructor(private readonly state: RuntimeState) {}

  get(worldId: string) {
    return this.state.getRun(worldId);
  }

  prepare(worldId: string, input: RunStartInput, output?: LiveOutputSettings | null) {
    this.requireActiveWorld(worldId);
    const world = this.state.getWorld(worldId);
    if (!world) throw new ApiError(404, 'not_found', 'world does not exist');
    const run = this.state.getRun(worldId) ?? newRun(worldId);
    if (isActive(run)) throw new ApiError(409, 'invalid_state', 'the project is already running');
    const generation = applyGenerationInput(world.generation, input);
    if (generation.model === 'none') {
      throw new ApiError(400, 'missing_video_model', 'select a video model before starting');
    }
    if (isHostedGenerationModel(generation.model) && !this.state.provider.falApiKey) {
      throw new ApiError(
        400,
        'missing_provider_key',
        'configure a provider key before starting hosted generation',
      );
    }
    if (isHostedVisionModel(generation.visionModel) && !this.state.provider.googleApiKey) {
      throw new ApiError(
        400,
        'missing_vision_provider_key',
        'configure a Google API key before starting hosted vision',
      );
    }
    const nextWorld = { ...world, generation };
    this.state.setWorld(worldId, nextWorld);
    const nextRun = newRun(worldId);
    nextRun.state = 'preparing';
    nextRun.startedAt = nowIso();
    nextRun.outputSettings = output ?? null;
    nextRun.output = outputSnapshot(output);
    nextRun.metrics.outputState = output ? 'connecting' : 'idle';
    nextRun.metrics.chatState = 'idle';
    this.state.setRun(worldId, nextRun);
    this.state.persist();
    return { world: clone(nextWorld), run: clone(nextRun) };
  }

  stop(worldId: string) {
    this.requireActiveWorld(worldId);
    const run = this.requireRun(worldId);
    if (run.state === 'preparing' || run.state === 'running') run.state = 'stopping';
    this.state.persist();
    return clone(run);
  }

  finish(worldId: string, failedMessage?: string) {
    const run = this.requireRun(worldId);
    run.state = failedMessage ? 'failed' : 'stopped';
    run.lastError = failedMessage ?? run.lastError;
    run.stoppedAt = nowIso();
    run.metrics.outputState = failedMessage ? 'failed' : 'stopped';
    run.metrics.chatState = failedMessage ? 'failed' : 'stopped';
    run.metrics.queueDepth = 0;
    touchMetrics(run);
    this.state.persist();
    return clone(run);
  }

  markRunning(worldId: string) {
    const run = this.requireRun(worldId);
    if (run.state === 'preparing') run.state = 'running';
    run.metrics.outputState = run.output ? 'connected' : 'idle';
    run.metrics.chatState = this.state.provider.twitchChannel ? 'connecting' : 'idle';
    this.state.persist();
    return clone(run);
  }

  restart(worldId: string) {
    this.requireActiveWorld(worldId);
    const previous = this.requireRun(worldId);
    if (isActive(previous))
      throw new ApiError(409, 'invalid_state', 'stop the current run before restarting');
    const world = this.state.getWorld(worldId);
    if (!world) throw new ApiError(404, 'not_found', 'world does not exist');
    const nextRun = newRun(worldId);
    nextRun.state = 'preparing';
    nextRun.startedAt = nowIso();
    nextRun.outputSettings = previous.outputSettings ?? null;
    nextRun.output = outputSnapshot(nextRun.outputSettings);
    nextRun.metrics.outputState = nextRun.output ? 'connecting' : 'idle';
    this.state.setRun(worldId, nextRun);
    this.state.persist();
    return { world: clone(world), run: clone(nextRun) };
  }

  append(worldId: string, scene: GeneratedScene, generation: GenerationSettings) {
    const run = this.requireRun(worldId);
    const snapshot = appendScene(run, scene, generation);
    touchMetrics(run);
    this.state.persist();
    return { run: clone(run), scene: clone(snapshot) };
  }

  choose(worldId: string, optionId: string) {
    const run = this.requireRun(worldId);
    if (run.state !== 'running')
      throw new ApiError(409, 'invalid_state', 'choose a direction while the run is running');
    const current = run.currentScene;
    const option = current?.options.find((candidate) => candidate.id === optionId);
    if (!option) throw new ApiError(404, 'not_found', 'scene option does not exist');
    option.votes += 1;
    run.pendingDirection = option.title;
    this.state.persist();
    return clone(run);
  }

  updateConfig(worldId: string, input: RunConfigInput) {
    this.requireActiveWorld(worldId);
    const world = this.state.getWorld(worldId);
    if (!world) throw new ApiError(404, 'not_found', 'world does not exist');
    const run = this.requireRun(worldId);
    if (isActive(run))
      throw new ApiError(
        409,
        'invalid_state',
        'stop the current run before applying project settings',
      );
    const generation = applyGenerationInput(world.generation, input);
    if (isHostedGenerationModel(generation.model) && !this.state.provider.falApiKey) {
      throw new ApiError(
        400,
        'missing_provider_key',
        'configure a provider key before selecting hosted generation',
      );
    }
    if (isHostedVisionModel(generation.visionModel) && !this.state.provider.googleApiKey) {
      throw new ApiError(
        400,
        'missing_vision_provider_key',
        'configure a Google API key before selecting hosted vision',
      );
    }
    this.state.setWorld(worldId, { ...world, generation });
    this.state.persist();
    return clone(run);
  }

  metrics(worldId: string): RunMetricsResponse {
    this.requireActiveWorld(worldId);
    const run = this.requireRun(worldId);
    touchMetrics(run);
    this.state.persist();
    return { runId: run.id, state: run.state, sampledAt: nowIso(), metrics: clone(run.metrics) };
  }

  private requireActiveWorld(worldId: string) {
    if (!this.state.getWorld(worldId)) throw new ApiError(404, 'not_found', 'world does not exist');
    if (this.state.activeWorldId !== worldId)
      throw new ApiError(409, 'invalid_state', 'world is not the active project');
  }

  private requireRun(worldId: string) {
    const run = this.state.getRun(worldId);
    if (!run) throw new ApiError(404, 'not_found', 'no run exists');
    return run;
  }
}
