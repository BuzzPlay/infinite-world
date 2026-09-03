import type {
  GenerationSettings,
  LiveOutputSettings,
  RunMetrics,
  RunSnapshot,
  SceneSnapshot,
  WorldResponse,
  WorldSnapshot,
} from '@infinite-world/api-contract';

import type { GeneratedScene, StoredRun } from '../types.js';

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

export function newRun(worldId: string, id: string = crypto.randomUUID()): StoredRun {
  return {
    id,
    worldId,
    state: 'created',
    sceneCount: 0,
    currentScene: null,
    lastError: null,
    metrics: freshMetrics(),
    startedAt: null,
    stoppedAt: null,
    output: null,
    scenes: [],
    generationHistory: [],
    outputSettings: null,
    pendingDirection: null,
    continuityImageUrl: null,
  };
}

export function normalizeStoredRun(run: StoredRun): StoredRun {
  const next = { ...newRun(run.worldId, run.id), ...run };
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
    pendingDirection: _pendingDirection,
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

export function appendScene(run: StoredRun, scene: GeneratedScene, generation: GenerationSettings) {
  const sequence = run.scenes.length + 1;
  const snapshot: SceneSnapshot = {
    id: `scene-${run.id}-${sequence}`,
    sequence,
    prompt: scene.prompt,
    previewUrl: scene.previewUrl,
    mediaType: scene.mediaType,
    contextSummary: scene.contextSummary,
    options: sceneOptions(sequence),
    generatedAt: nowIso(),
    generationLatencyMs: scene.generationLatencyMs,
  };
  run.scenes.push(snapshot);
  run.currentScene = snapshot;
  run.sceneCount = run.scenes.length;
  run.metrics.sceneCount = run.sceneCount;
  run.metrics.generationLatencyMs = scene.generationLatencyMs;
  run.metrics.averageGenerationLatencyMs = Math.round(
    run.scenes.reduce((sum, current) => sum + current.generationLatencyMs, 0) / run.scenes.length,
  );
  run.metrics.currentPrompt = scene.prompt;
  run.metrics.queueDepth = 0;
  run.metrics.outputFps = generation.targetFps;
  run.pendingDirection = null;
  run.continuityImageUrl = scene.continuityImageUrl ?? null;
  run.generationHistory.push({
    generationId: sequence,
    timestamp: nowIso(),
    prompt: scene.prompt,
    negativePrompt: generation.negativePrompt,
    initialImageUrl: generation.initialImageUrl,
    model: generation.model,
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
  return snapshot;
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

function sceneOptions(sequence: number) {
  return [
    ['A', 'Follow the light beyond the ridge'],
    ['B', 'Stay with the river as night falls'],
    ['C', 'Turn toward the distant signal'],
    ['D', 'Wait and see what changes'],
  ].map(([label, title]) => ({ id: `scene-${sequence}-${label}`, label, title, votes: 0 }));
}
