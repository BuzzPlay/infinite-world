import {
  DEFAULT_GENERATION,
  type GenerationHistorySnapshot,
  type GenerationSettings,
  type LiveOutputSettings,
  type RunMetrics,
  type RunSnapshot,
  type RunVersionSnapshot,
  type SceneSnapshot,
  type WorldResponse,
  type WorldSnapshot,
} from '@infinite-world/api-contract';

import type { GeneratedScene, PendingBranch, StoredRun } from '../types.js';
import { normalizeGeneration } from './generation.js';

export function nowIso() {
  return new Date().toISOString();
}

export function clone<T>(value: T): T {
  return structuredClone(value);
}

export function freshMetrics(): RunMetrics {
  return {
    sceneCount: 0,
    generationLatencyMs: 0,
    averageGenerationLatencyMs: 0,
    currentPrompt: '',
    queueDepth: 0,
    outputFps: 0,
    uptimeSeconds: 0,
    outputState: 'idle',
    outputReconnects: 0,
    outputError: null,
    chatState: 'idle',
    chatQueueDepth: 0,
    chatReconnects: 0,
    history: [],
  };
}

export function newRun(
  worldId: string,
  id: string = crypto.randomUUID(),
  version = 1,
  generation: GenerationSettings = DEFAULT_GENERATION,
): StoredRun {
  return {
    id,
    worldId,
    version,
    versions: [
      {
        id,
        version,
        generation: clone(generation),
        latestSceneId: null,
        lastActivityAt: null,
      },
    ],
    revision: 0,
    state: 'created',
    sceneCount: 0,
    currentScene: null,
    generationTask: null,
    lastError: null,
    metrics: freshMetrics(),
    startedAt: null,
    stoppedAt: null,
    output: null,
    scenes: [],
    generationHistory: [],
    outputSettings: null,
    pendingBranch: null,
    continuityImageUrl: null,
  };
}

export function normalizeStoredRun(
  run: StoredRun,
  fallbackGeneration: GenerationSettings = DEFAULT_GENERATION,
): StoredRun {
  const next = {
    ...newRun(run.worldId, run.id, run.version ?? 1, fallbackGeneration),
    ...run,
  };
  next.scenes = run.scenes.map(clone);
  next.scenes = next.scenes.map((scene) => ({
    ...scene,
    continuityImageUrl: scene.continuityImageUrl ?? null,
  }));
  next.generationHistory = (run.generationHistory ?? []).map(clone);
  next.versions = normalizeRunVersions(run, fallbackGeneration);
  next.currentScene = run.currentScene
    ? (next.scenes.find((scene) => scene.id === run.currentScene?.id) ?? null)
    : null;
  next.generationTask = isActive(next) ? (run.generationTask ?? null) : null;
  next.continuityImageUrl = next.currentScene?.continuityImageUrl ?? null;
  next.pendingBranch = run.pendingBranch ?? null;
  next.metrics = { ...freshMetrics(), ...run.metrics, history: run.metrics?.history ?? [] };
  next.output = run.output ?? outputSnapshot(run.outputSettings);
  next.outputSettings = run.outputSettings ?? null;
  return next;
}

export function outputSnapshot(output: LiveOutputSettings | null | undefined) {
  if (!output) return null;
  return {
    mode: output.mode,
    platform: output.platform,
    endpoint: output.endpoint,
    title: output.title,
    configured: output.mode === 'webrtc' || Boolean(output.streamKey?.trim()),
  };
}

export function publicRun(run: StoredRun): RunSnapshot {
  const {
    outputSettings: _outputSettings,
    pendingBranch: _pendingBranch,
    continuityImageUrl: _continuityImageUrl,
    ...snapshot
  } = run;
  return structuredClone(snapshot);
}

export function safeWorldResponse(
  world: WorldSnapshot,
  run: StoredRun,
  providerApiKeyConfigured: boolean,
): WorldResponse {
  return { world: clone(world), run: publicRun(run), providerApiKeyConfigured };
}

export function appendScene(
  run: StoredRun,
  scene: GeneratedScene,
  generation: GenerationSettings,
  branch: Pick<PendingBranch, 'sceneId' | 'optionId'> | null,
) {
  setActiveVersionGeneration(run, generation);
  const sequence =
    run.scenes.reduce((maximum, current) => Math.max(maximum, current.sequence), 0) + 1;
  const versionSceneSequence =
    run.scenes
      .filter((current) => current.versionId === run.id)
      .reduce((maximum, current) => Math.max(maximum, current.versionSceneSequence), 0) + 1;
  const snapshot: SceneSnapshot = {
    id: `scene-${run.id}-${sequence}`,
    versionId: run.id,
    version: run.version,
    versionSceneSequence,
    sequence,
    parentSceneId: branch?.sceneId ?? null,
    sourceOptionId: branch?.optionId ?? null,
    prompt: scene.prompt,
    previewUrl: scene.previewUrl,
    continuityImageUrl: scene.continuityImageUrl ?? null,
    mediaType: scene.mediaType,
    contextSummary: scene.contextSummary,
    options: [],
    generatedAt: nowIso(),
    generationLatencyMs: scene.generationLatencyMs,
  };
  run.scenes.push(snapshot);
  run.currentScene = snapshot;
  run.generationTask = null;
  updateVersionActivity(run, snapshot);
  run.sceneCount += 1;
  run.metrics.sceneCount = run.sceneCount;
  run.metrics.generationLatencyMs = scene.generationLatencyMs;
  const currentRunScenes = run.scenes.filter((current) => current.versionId === run.id);
  run.metrics.averageGenerationLatencyMs = Math.round(
    currentRunScenes.reduce((sum, current) => sum + current.generationLatencyMs, 0) /
      currentRunScenes.length,
  );
  run.metrics.currentPrompt = scene.prompt;
  run.metrics.queueDepth = 0;
  run.metrics.outputFps = generation.targetFps;
  run.continuityImageUrl = scene.continuityImageUrl ?? null;
  run.generationHistory.push({
    generationId: sequence,
    timestamp: nowIso(),
    prompt: scene.prompt,
    negativePrompt: generation.negativePrompt,
    initialImageUrl: run.sceneCount === 1 ? generation.initialImageUrl : null,
    model: generation.model,
    visionModel: generation.visionModel,
    mode: generation.mode,
    width: generation.width,
    height: generation.height,
    resolution: generation.resolution,
    aspectRatio: generation.aspectRatio,
    durationSeconds: generation.durationSeconds,
    frameRate: generation.frameRate,
    numFrames: generation.numFrames,
    strength: generation.strength,
    guidanceScale: generation.guidanceScale,
    seed: generation.seed,
    timesteps: generation.timesteps,
    targetFps: generation.targetFps,
    stgScale: generation.stgScale,
    spatioTemporalGuidanceBlocks: generation.spatioTemporalGuidanceBlocks,
    noiseScale: generation.noiseScale,
    enableAudio: generation.enableAudio,
    stylePreset: generation.stylePreset,
    characterRefs: generation.characterRefs,
    selectedComment: scene.selectedComment ?? null,
  });
  run.revision += 1;
  return snapshot;
}

export function preserveSceneVersions(source: StoredRun, target: StoredRun) {
  target.scenes = source.scenes.map(clone);
  target.generationHistory = source.generationHistory.map(clone);
  const versions = new Map(source.versions.map((version) => [version.id, clone(version)]));
  for (const version of target.versions) versions.set(version.id, clone(version));
  target.versions = [...versions.values()].sort((left, right) => left.version - right.version);
  return target;
}

export function generationForRunVersion(
  run: Pick<StoredRun, 'versions'>,
  versionId: string,
  fallback: GenerationSettings = DEFAULT_GENERATION,
) {
  return clone(run.versions.find((version) => version.id === versionId)?.generation ?? fallback);
}

export function setActiveVersionGeneration(
  run: Pick<StoredRun, 'id' | 'version' | 'versions'>,
  generation: GenerationSettings,
) {
  const existing = run.versions.find((version) => version.id === run.id);
  if (existing) {
    existing.generation = clone(generation);
    return;
  }
  run.versions.push({
    id: run.id,
    version: run.version,
    generation: clone(generation),
    latestSceneId: null,
    lastActivityAt: null,
  });
  run.versions.sort((left, right) => left.version - right.version);
}

function updateVersionActivity(run: Pick<StoredRun, 'versions'>, scene: SceneSnapshot) {
  const version = run.versions.find((candidate) => candidate.id === scene.versionId);
  if (!version) return;
  version.latestSceneId = scene.id;
  version.lastActivityAt = scene.generatedAt;
}

function refreshVersionActivity(run: Pick<StoredRun, 'scenes' | 'versions'>) {
  for (const version of run.versions) {
    const latestScene = latestSceneForVersion(run.scenes, version.id);
    version.latestSceneId = latestScene?.id ?? null;
    version.lastActivityAt = latestScene?.generatedAt ?? null;
  }
}

export function nextRunVersion(run: StoredRun) {
  return Math.max(run.version, ...run.scenes.map((scene) => scene.version), 0) + 1;
}

export function runForExplicitStart(source: StoredRun, generation: GenerationSettings) {
  const hasScenesInCurrentVersion = source.scenes.some((scene) => scene.versionId === source.id);
  const target = hasScenesInCurrentVersion
    ? newRun(source.worldId, crypto.randomUUID(), nextRunVersion(source), generation)
    : newRun(source.worldId, source.id, source.version, generation);
  return preserveSceneVersions(source, target);
}

export function runForSceneBranch(
  source: StoredRun,
  sourceScene: SceneSnapshot,
  generation = generationForRunVersion(source, sourceScene.versionId),
) {
  const target = preserveSceneVersions(
    source,
    newRun(source.worldId, sourceScene.versionId, sourceScene.version, generation),
  );
  target.sceneCount = target.scenes.filter(
    (scene) => scene.versionId === sourceScene.versionId,
  ).length;
  target.metrics.sceneCount = target.sceneCount;
  target.metrics.currentPrompt = sourceScene.prompt;
  target.metrics.generationLatencyMs = sourceScene.generationLatencyMs;
  target.currentScene = target.scenes.find((scene) => scene.id === sourceScene.id) ?? null;
  target.continuityImageUrl = target.currentScene?.continuityImageUrl ?? null;
  return target;
}

export function removeSceneBranch(run: StoredRun, sceneId: string) {
  if (!run.scenes.some((scene) => scene.id === sceneId)) return [];

  const scenesById = new Map(run.scenes.map((scene) => [scene.id, scene]));
  const removedIds = new Set([sceneId]);
  let foundDescendant = true;
  while (foundDescendant) {
    foundDescendant = false;
    for (const scene of run.scenes) {
      if (scene.parentSceneId && removedIds.has(scene.parentSceneId) && !removedIds.has(scene.id)) {
        removedIds.add(scene.id);
        foundDescendant = true;
      }
    }
  }

  const removedSequences = new Set(
    run.scenes.filter((scene) => removedIds.has(scene.id)).map((scene) => scene.sequence),
  );
  const removedFromCurrentRun = run.scenes.filter(
    (scene) => removedIds.has(scene.id) && scene.versionId === run.id,
  ).length;
  const fallbackScene = run.currentScene
    ? closestSurvivingAncestor(run.currentScene, scenesById, removedIds)
    : null;

  run.scenes = run.scenes.filter((scene) => !removedIds.has(scene.id));
  run.generationHistory = run.generationHistory.filter(
    (record) => !removedSequences.has(record.generationId),
  );
  run.sceneCount = Math.max(0, run.sceneCount - removedFromCurrentRun);
  run.metrics.sceneCount = run.sceneCount;

  if (run.currentScene && removedIds.has(run.currentScene.id)) {
    run.currentScene = fallbackScene;
    run.continuityImageUrl = fallbackScene?.continuityImageUrl ?? null;
  }
  if (run.pendingBranch && removedIds.has(run.pendingBranch.sceneId)) {
    run.pendingBranch = null;
  }
  if (run.generationTask?.sourceSceneId && removedIds.has(run.generationTask.sourceSceneId)) {
    run.generationTask = null;
  }

  refreshVersionActivity(run);

  run.metrics.currentPrompt = run.currentScene?.prompt ?? '';
  run.metrics.generationLatencyMs = run.currentScene?.generationLatencyMs ?? 0;
  run.revision += 1;
  return [...removedIds];
}

function closestSurvivingAncestor(
  scene: SceneSnapshot,
  scenesById: Map<string, SceneSnapshot>,
  removedIds: Set<string>,
) {
  let parentId = scene.parentSceneId;
  while (parentId) {
    const parent = scenesById.get(parentId);
    if (!parent) return null;
    if (!removedIds.has(parent.id)) return parent;
    parentId = parent.parentSceneId;
  }
  return null;
}

export function removeRunVersion(run: StoredRun, versionId: string) {
  const removedScenes = run.scenes.filter((scene) => scene.versionId === versionId);
  if (!removedScenes.length) return [];

  const removedGeneration = generationForRunVersion(run, versionId);
  const removedActiveVersion = run.id === versionId;
  const removedIds = new Set(removedScenes.map((scene) => scene.id));
  const removedSequences = new Set(removedScenes.map((scene) => scene.sequence));
  run.scenes = run.scenes
    .filter((scene) => !removedIds.has(scene.id))
    .map((scene) =>
      scene.parentSceneId && removedIds.has(scene.parentSceneId)
        ? { ...scene, parentSceneId: null, sourceOptionId: null }
        : scene,
    );
  run.generationHistory = run.generationHistory.filter(
    (record) => !removedSequences.has(record.generationId),
  );
  run.versions = run.versions.filter((version) => version.id !== versionId);
  if (run.pendingBranch && removedIds.has(run.pendingBranch.sceneId)) {
    run.pendingBranch = null;
  }
  if (run.generationTask?.sourceSceneId && removedIds.has(run.generationTask.sourceSceneId)) {
    run.generationTask = null;
  }
  if (run.currentScene && removedIds.has(run.currentScene.id)) {
    run.currentScene = null;
  }
  if (removedActiveVersion) activateLatestRemainingVersion(run, removedGeneration);
  run.revision += 1;
  return [...removedIds];
}

function activateLatestRemainingVersion(run: StoredRun, fallbackGeneration: GenerationSettings) {
  const latestScene = run.scenes.reduce<SceneSnapshot | null>((latest, scene) => {
    if (!latest || scene.version > latest.version) return scene;
    if (scene.version < latest.version) return latest;
    return scene.versionSceneSequence > latest.versionSceneSequence ? scene : latest;
  }, null);

  if (!latestScene) {
    Object.assign(run, newRun(run.worldId, crypto.randomUUID(), 1, fallbackGeneration));
    return;
  }

  const versionScenes = run.scenes
    .filter((scene) => scene.versionId === latestScene.versionId)
    .sort((left, right) => left.versionSceneSequence - right.versionSceneSequence);
  const currentScene = versionScenes.at(-1) ?? latestScene;
  const averageGenerationLatencyMs = Math.round(
    versionScenes.reduce((total, scene) => total + scene.generationLatencyMs, 0) /
      versionScenes.length,
  );

  run.id = latestScene.versionId;
  run.version = latestScene.version;
  if (!run.versions.some((version) => version.id === latestScene.versionId)) {
    run.versions.push({
      id: latestScene.versionId,
      version: latestScene.version,
      generation: clone(fallbackGeneration),
      latestSceneId: null,
      lastActivityAt: null,
    });
  }
  run.state = 'stopped';
  run.sceneCount = versionScenes.length;
  run.currentScene = currentScene;
  run.lastError = null;
  run.startedAt = versionScenes[0]?.generatedAt ?? null;
  run.stoppedAt = currentScene.generatedAt;
  run.output = null;
  run.outputSettings = null;
  run.pendingBranch = null;
  run.generationTask = null;
  run.continuityImageUrl = currentScene.continuityImageUrl ?? null;
  run.metrics = {
    ...freshMetrics(),
    sceneCount: versionScenes.length,
    generationLatencyMs: currentScene.generationLatencyMs,
    averageGenerationLatencyMs,
    currentPrompt: currentScene.prompt,
    outputState: 'stopped',
    chatState: 'stopped',
  };
  updateVersionActivity(run, currentScene);
}

function normalizeRunVersions(run: StoredRun, fallbackGeneration: GenerationSettings) {
  const storedVersions = Array.isArray(run.versions) ? run.versions : [];
  const versions = new Map<string, RunVersionSnapshot>();
  for (const version of storedVersions) {
    const latestScene = latestSceneForVersion(run.scenes ?? [], version.id);
    versions.set(version.id, {
      id: version.id,
      version: version.version,
      generation: normalizeGeneration(version.generation ?? fallbackGeneration),
      latestSceneId: version.latestSceneId ?? latestScene?.id ?? null,
      lastActivityAt: version.lastActivityAt ?? latestScene?.generatedAt ?? null,
    });
  }

  const versionNumbers = new Map<string, number>([[run.id, run.version ?? 1]]);
  for (const scene of run.scenes ?? []) versionNumbers.set(scene.versionId, scene.version);
  for (const [versionId, version] of versionNumbers) {
    if (versions.has(versionId)) continue;
    const latestScene = latestSceneForVersion(run.scenes ?? [], versionId);
    versions.set(versionId, {
      id: versionId,
      version,
      generation: generationFromHistory(run, versionId, fallbackGeneration),
      latestSceneId: latestScene?.id ?? null,
      lastActivityAt: latestScene?.generatedAt ?? null,
    });
  }
  return [...versions.values()].sort((left, right) => left.version - right.version);
}

function latestSceneForVersion(scenes: SceneSnapshot[], versionId: string) {
  return scenes
    .filter((scene) => scene.versionId === versionId)
    .reduce<SceneSnapshot | null>(
      (latest, scene) =>
        !latest || scene.versionSceneSequence > latest.versionSceneSequence ? scene : latest,
      null,
    );
}

function generationFromHistory(
  run: StoredRun,
  versionId: string,
  fallbackGeneration: GenerationSettings,
) {
  const generationIds = new Set(
    (run.scenes ?? [])
      .filter((scene) => scene.versionId === versionId)
      .map((scene) => scene.sequence),
  );
  const records = (run.generationHistory ?? [])
    .filter((record) => generationIds.has(record.generationId))
    .sort((left, right) => left.generationId - right.generationId);
  const latest = records.at(-1);
  if (!latest) return normalizeGeneration(fallbackGeneration);
  return generationFromRecord(latest, records[0]?.initialImageUrl ?? null, fallbackGeneration);
}

function generationFromRecord(
  record: GenerationHistorySnapshot,
  initialImageUrl: string | null,
  fallback: GenerationSettings,
) {
  return normalizeGeneration({
    ...fallback,
    model: record.model,
    visionModel: record.visionModel ?? fallback.visionModel,
    mode: record.mode,
    width: record.width,
    height: record.height,
    durationSeconds: record.durationSeconds,
    frameRate: record.frameRate,
    resolution: record.resolution,
    aspectRatio: record.aspectRatio,
    guidanceScale: record.guidanceScale,
    seed: record.seed ?? fallback.seed,
    negativePrompt: record.negativePrompt,
    initialImageUrl,
    numFrames: record.numFrames,
    strength: record.strength,
    timesteps: record.timesteps,
    targetFps: record.targetFps,
    stgScale: record.stgScale,
    spatioTemporalGuidanceBlocks: record.spatioTemporalGuidanceBlocks,
    noiseScale: record.noiseScale,
    enableAudio: record.enableAudio,
    stylePreset: record.stylePreset,
    characterRefs: record.characterRefs,
  });
}

export function touchMetrics(run: StoredRun) {
  if (run.startedAt && isActive(run)) {
    run.metrics.uptimeSeconds = Math.max(
      0,
      Math.floor((Date.now() - Date.parse(run.startedAt)) / 1000),
    );
  }
  const timestamp = nowIso();
  const previous = run.metrics.history.at(-1);
  if (!previous || previous.timestamp !== timestamp) {
    run.metrics.history = [
      ...run.metrics.history,
      {
        timestamp,
        sceneCount: run.metrics.sceneCount,
        generationLatencyMs: run.metrics.generationLatencyMs,
        averageGenerationLatencyMs: run.metrics.averageGenerationLatencyMs,
        queueDepth: run.metrics.queueDepth,
        outputFps: run.metrics.outputFps,
        uptimeSeconds: run.metrics.uptimeSeconds,
        outputState: run.metrics.outputState,
        outputReconnects: run.metrics.outputReconnects,
        chatState: run.metrics.chatState,
        chatQueueDepth: run.metrics.chatQueueDepth,
        chatReconnects: run.metrics.chatReconnects,
      },
    ].slice(-120);
  }
}

export function isActive(run: StoredRun) {
  return run.state === 'preparing' || run.state === 'running' || run.state === 'stopping';
}

export function sceneLineage(scenes: SceneSnapshot[], sceneId: string | null) {
  if (!sceneId) return [];
  const byId = new Map(scenes.map((scene) => [scene.id, scene]));
  const lineage: SceneSnapshot[] = [];
  const seen = new Set<string>();
  let current = byId.get(sceneId) ?? null;
  while (current && !seen.has(current.id)) {
    lineage.push(current);
    seen.add(current.id);
    current = current.parentSceneId ? (byId.get(current.parentSceneId) ?? null) : null;
  }
  return lineage.reverse();
}
