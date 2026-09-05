import type {
  GenerationSettings,
  LiveOutputSettings,
  RunMetricsResponse,
} from '@infinite-world/api-contract';

import {
  applyGenerationInput,
  isHostedGenerationModel,
  isVisionModelConfigured,
} from '../domain/generation.js';
import {
  appendScene,
  clone,
  generationForRunVersion,
  isActive,
  newRun,
  nowIso,
  outputSnapshot,
  removeRunVersion,
  removeSceneBranch,
  runForExplicitStart,
  runForSceneBranch,
  sceneLineage,
  setActiveVersionGeneration,
  touchMetrics,
} from '../domain/run.js';
import type { RuntimeState } from '../runtime/state.js';
import { ApiError } from '../shared/errors.js';
import type { GeneratedScene, RunConfigInput, RunStartInput, StoredRun } from '../types.js';

export class RunService {
  constructor(private readonly state: RuntimeState) {}

  get(worldId: string) {
    return this.state.getRun(worldId);
  }

  prepare(worldId: string, input: RunStartInput, output?: LiveOutputSettings | null) {
    this.requireActiveWorld(worldId);
    const world = this.state.getWorld(worldId);
    if (!world) throw new ApiError(404, 'not_found', 'world does not exist');
    const previous = this.state.getRun(worldId) ?? newRun(worldId, undefined, 1, world.generation);
    if (isActive(previous))
      throw new ApiError(409, 'invalid_state', 'the project is already running');
    const generation = applyGenerationInput(world.generation, input);
    this.requireRunnableGeneration(generation);
    const nextWorld = { ...world, generation };
    this.state.setWorld(worldId, nextWorld);
    const nextRun = runForExplicitStart(previous, generation);
    nextRun.state = 'preparing';
    nextRun.startedAt = nowIso();
    nextRun.generationTask = {
      sourceSceneId: null,
      optionId: null,
      startedAt: nextRun.startedAt,
    };
    nextRun.outputSettings = output ?? null;
    nextRun.output = outputSnapshot(output);
    nextRun.metrics.outputState = output ? 'connecting' : 'idle';
    nextRun.metrics.chatState = 'idle';
    nextRun.revision = 1;
    this.state.setRun(worldId, nextRun);
    this.state.persist();
    return { world: clone(nextWorld), run: clone(nextRun) };
  }

  stop(worldId: string) {
    this.requireActiveWorld(worldId);
    const run = this.requireRun(worldId);
    if (run.state === 'preparing' || run.state === 'running') run.state = 'stopping';
    run.revision += 1;
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
    run.generationTask = null;
    touchMetrics(run);
    run.revision += 1;
    this.state.persist();
    return clone(run);
  }

  markRunning(worldId: string) {
    const run = this.requireRun(worldId);
    if (run.state === 'preparing') run.state = 'running';
    run.metrics.outputState = run.output ? 'connected' : 'idle';
    run.metrics.chatState = this.state.provider.twitchChannel ? 'connecting' : 'idle';
    run.revision += 1;
    this.state.persist();
    return clone(run);
  }

  beginGeneration(worldId: string) {
    const run = this.requireRun(worldId);
    if (run.state !== 'running')
      throw new ApiError(409, 'invalid_state', 'generate a scene while the run is running');
    const pending = run.pendingBranch ?? null;
    const parentScene = pending
      ? (run.scenes.find((scene) => scene.id === pending.sceneId) ?? null)
      : run.currentScene;
    run.generationTask ??= {
      sourceSceneId: parentScene?.id ?? null,
      optionId: pending?.optionId ?? null,
      startedAt: nowIso(),
    };
    run.pendingBranch = null;
    run.revision += 1;
    this.state.persist();

    const contextualRun = clone(run);
    contextualRun.currentScene = parentScene ? clone(parentScene) : null;
    contextualRun.continuityImageUrl = parentScene?.continuityImageUrl ?? null;
    contextualRun.scenes = sceneLineage(run.scenes, parentScene?.id ?? null).map(clone);
    return {
      run: contextualRun,
      parentSceneId: parentScene?.id ?? null,
      sourceOptionId: pending?.optionId ?? null,
      branchDirection: pending?.direction ?? null,
    };
  }

  hasPendingBranch(worldId: string) {
    return Boolean(this.state.getRun(worldId)?.pendingBranch);
  }

  restart(worldId: string) {
    this.requireActiveWorld(worldId);
    const previous = this.requireRun(worldId);
    if (isActive(previous))
      throw new ApiError(409, 'invalid_state', 'stop the current run before restarting');
    const world = this.state.getWorld(worldId);
    if (!world) throw new ApiError(404, 'not_found', 'world does not exist');
    const generation = applyGenerationInput(world.generation, {});
    this.requireRunnableGeneration(generation);
    const nextWorld = { ...world, generation };
    const nextRun = runForExplicitStart(previous, generation);
    nextRun.state = 'preparing';
    nextRun.startedAt = nowIso();
    nextRun.generationTask = {
      sourceSceneId: null,
      optionId: null,
      startedAt: nextRun.startedAt,
    };
    nextRun.outputSettings = previous.outputSettings ?? null;
    nextRun.output = outputSnapshot(nextRun.outputSettings);
    nextRun.metrics.outputState = nextRun.output ? 'connecting' : 'idle';
    nextRun.revision = 1;
    this.state.setWorld(worldId, nextWorld);
    this.state.setRun(worldId, nextRun);
    this.state.persist();
    return { world: clone(nextWorld), run: clone(nextRun) };
  }

  append(
    worldId: string,
    scene: GeneratedScene,
    generation: GenerationSettings,
    branch: { sceneId: string; optionId: string | null } | null,
  ) {
    const run = this.requireRun(worldId);
    const snapshot = appendScene(run, scene, generation, branch);
    touchMetrics(run);
    this.state.persist();
    return { run: clone(run), scene: clone(snapshot) };
  }

  setSceneContinuityImage(worldId: string, sceneId: string, continuityImageUrl: string) {
    const run = this.requireRun(worldId);
    const scene = run.scenes.find((candidate) => candidate.id === sceneId);
    if (!scene || scene.continuityImageUrl) return;
    scene.continuityImageUrl = continuityImageUrl;
    if (run.currentScene?.id === sceneId) {
      run.currentScene = scene;
      run.continuityImageUrl = continuityImageUrl;
    }
    run.revision += 1;
    this.state.persist();
  }

  choose(worldId: string, optionId: string, sceneId?: string) {
    this.requireActiveWorld(worldId);
    const previous = this.requireRun(worldId);
    const selection = selectedBranch(previous, optionId, sceneId);
    const world = this.state.getWorld(worldId);
    if (!world) throw new ApiError(404, 'not_found', 'world does not exist');
    const generation = applyGenerationInput(
      generationForRunVersion(previous, selection.scene.versionId, world.generation),
      {},
    );
    if (previous.state === 'running') {
      if (previous.generationTask || previous.pendingBranch) {
        throw new ApiError(409, 'invalid_state', 'a scene is already being generated');
      }
      if (selection.scene.versionId !== previous.id) {
        throw new ApiError(
          409,
          'invalid_state',
          'stop the current run before continuing a different version',
        );
      }
      this.requireRunnableGeneration(generation);
      selection.option.votes += 1;
      previous.pendingBranch = selection.branch;
      previous.generationTask = {
        sourceSceneId: selection.scene.id,
        optionId: selection.option.id,
        startedAt: nowIso(),
      };
      previous.revision += 1;
      this.state.persist();
      return clone(previous);
    }
    if (isActive(previous))
      throw new ApiError(409, 'invalid_state', 'wait for the current run state to finish');

    this.requireRunnableGeneration(generation);
    const nextWorld = { ...world, generation };
    selection.option.votes += 1;
    const nextRun = runForSceneBranch(previous, selection.scene, generation);
    nextRun.pendingBranch = selection.branch;
    nextRun.state = 'preparing';
    nextRun.startedAt = nowIso();
    nextRun.generationTask = {
      sourceSceneId: selection.scene.id,
      optionId: selection.option.id,
      startedAt: nextRun.startedAt,
    };
    nextRun.revision = 1;
    this.state.setWorld(worldId, nextWorld);
    this.state.setRun(worldId, nextRun);
    this.state.persist();
    return clone(nextRun);
  }

  activateScene(worldId: string, sceneId: string) {
    this.requireActiveWorld(worldId);
    const previous = this.requireRun(worldId);
    if (previous.generationTask || previous.pendingBranch || previous.state === 'stopping') {
      throw new ApiError(409, 'invalid_state', 'wait for the current generation to finish');
    }
    const scene = previous.scenes.find((candidate) => candidate.id === sceneId);
    if (!scene) throw new ApiError(404, 'not_found', 'scene does not exist');
    const world = this.state.getWorld(worldId);
    if (!world) throw new ApiError(404, 'not_found', 'world does not exist');
    const generation = generationForRunVersion(previous, scene.versionId, world.generation);
    const nextRun = runForSceneBranch(previous, scene, generation);
    nextRun.state = 'preparing';
    nextRun.startedAt = nowIso();
    nextRun.stoppedAt = null;
    nextRun.revision = 1;
    this.state.setWorld(worldId, { ...world, generation });
    this.state.setRun(worldId, nextRun);
    this.state.persist();
    return clone(nextRun);
  }

  deleteSceneBranch(worldId: string, sceneId: string) {
    this.requireActiveWorld(worldId);
    const run = this.requireRun(worldId);
    const scene = run.scenes.find((candidate) => candidate.id === sceneId);
    if (!scene) throw new ApiError(404, 'not_found', 'scene does not exist');
    if (scene.versionSceneSequence === 1) {
      throw new ApiError(
        409,
        'invalid_state',
        'delete the run version from history instead of deleting its first scene',
      );
    }
    const generatingFromSceneId = run.generationTask?.sourceSceneId ?? null;
    const removedIds = removeSceneBranch(run, sceneId);
    const generationInterrupted = isActive(run) && removedIds.includes(generatingFromSceneId ?? '');
    touchMetrics(run);
    this.state.persist();
    return { run: clone(run), removedSceneIds: removedIds, generationInterrupted };
  }

  deleteRunVersion(worldId: string, versionId: string) {
    this.requireActiveWorld(worldId);
    const run = this.requireRun(worldId);
    if (isActive(run)) {
      throw new ApiError(409, 'invalid_state', 'stop the current run before deleting a version');
    }
    const previousVersionId = run.id;
    const removedIds = removeRunVersion(run, versionId);
    if (!removedIds.length) throw new ApiError(404, 'not_found', 'run version does not exist');
    if (run.id !== previousVersionId) {
      const world = this.state.getWorld(worldId);
      if (world) {
        this.state.setWorld(worldId, {
          ...world,
          generation: generationForRunVersion(run, run.id, world.generation),
        });
      }
    }
    touchMetrics(run);
    this.state.persist();
    return { run: clone(run), removedSceneIds: removedIds };
  }

  sceneOptionContext(worldId: string, sceneId: string) {
    this.requireActiveWorld(worldId);
    const world = this.state.getWorld(worldId);
    if (!world) throw new ApiError(404, 'not_found', 'world does not exist');
    const run = this.requireRun(worldId);
    const scene = run.scenes.find((candidate) => candidate.id === sceneId);
    if (!scene) throw new ApiError(404, 'not_found', 'scene does not exist');
    const generation = generationForRunVersion(run, scene.versionId, world.generation);
    const selectedVisionModel = generation.visionModel;
    if (!isVisionModelConfigured(selectedVisionModel, this.state.provider)) {
      throw new ApiError(
        400,
        'missing_vision_provider_key',
        'configure the selected vision provider before generating scene options',
      );
    }
    return {
      world: clone({
        ...world,
        generation,
      }),
      scene: clone(scene),
      lineage: sceneLineage(run.scenes, scene.id).map(clone),
    };
  }

  replaceSceneOptions(worldId: string, sceneId: string, titles: string[]) {
    this.requireActiveWorld(worldId);
    const run = this.requireRun(worldId);
    const scene = run.scenes.find((candidate) => candidate.id === sceneId);
    if (!scene) throw new ApiError(404, 'not_found', 'scene does not exist');
    const options = [...new Set(titles.map((title) => title.trim()).filter(Boolean))];
    if (options.length !== 4) {
      throw new ApiError(
        502,
        'invalid_scene_options',
        'the model did not return four distinct scene options',
      );
    }
    scene.options = options.map((title, index) => ({
      id: `${scene.id}-option-${crypto.randomUUID()}`,
      label: String.fromCharCode(65 + index),
      title,
      votes: 0,
    }));
    run.revision += 1;
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
    const generation = applyGenerationInput(
      generationForRunVersion(run, run.id, world.generation),
      input,
    );
    if (isHostedGenerationModel(generation.model) && !this.state.provider.falApiKey) {
      throw new ApiError(
        400,
        'missing_provider_key',
        'configure a provider key before selecting hosted generation',
      );
    }
    if (!isVisionModelConfigured(generation.visionModel, this.state.provider)) {
      throw new ApiError(
        400,
        'missing_vision_provider_key',
        'configure the selected vision provider before selecting hosted vision',
      );
    }
    setActiveVersionGeneration(run, generation);
    run.revision += 1;
    this.state.setWorld(worldId, { ...world, generation });
    this.state.persist();
    return clone(run);
  }

  metrics(worldId: string): RunMetricsResponse {
    this.requireActiveWorld(worldId);
    const run = this.requireRun(worldId);
    touchMetrics(run);
    run.revision += 1;
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

  private requireRunnableGeneration(generation: GenerationSettings) {
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
    if (!isVisionModelConfigured(generation.visionModel, this.state.provider)) {
      throw new ApiError(
        400,
        'missing_vision_provider_key',
        'configure the selected vision provider before starting hosted vision',
      );
    }
  }
}

function selectedBranch(run: StoredRun, optionId: string, sceneId?: string) {
  const sourceScene = sceneId ? run.scenes.find((scene) => scene.id === sceneId) : run.currentScene;
  if (!sourceScene) throw new ApiError(404, 'not_found', 'source scene does not exist');
  const option = sourceScene.options.find((candidate) => candidate.id === optionId);
  if (!option) throw new ApiError(404, 'not_found', 'scene option does not exist');
  return {
    scene: sourceScene,
    option,
    branch: {
      sceneId: sourceScene.id,
      optionId: option.id,
      direction: option.title,
    },
  };
}
