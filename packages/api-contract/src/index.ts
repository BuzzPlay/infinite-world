export type RunState = 'created' | 'preparing' | 'running' | 'stopping' | 'stopped' | 'failed';

export type GenerationMode = 'regular' | 'nightmare' | 'cohesive' | 'visual' | 'chaotic';

export type StylePreset = 'cohesive' | 'chaotic' | 'nightmare' | 'custom';

export type InteractionType = 'text' | 'voice' | 'image';

export interface CharacterReference {
  image: string;
  strength: number;
  label: string;
}

export interface GenerationSettings {
  /** The video model. Kept as `model` for compatibility with existing worlds. */
  model: string;
  visionModel: string;
  mode: GenerationMode;
  width: number;
  height: number;
  durationSeconds: number;
  frameRate: number;
  resolution: '480P' | '768P' | '2K' | '4K' | '1080p' | '1440p' | '2160p' | null;
  aspectRatio: 'auto' | '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | null;
  guidanceScale: number;
  seed: number | null;
  negativePrompt: string;
  initialImageUrl: string | null;
  numFrames: number;
  strength: number;
  timesteps: number[];
  targetFps: number;
  stgScale: number;
  spatioTemporalGuidanceBlocks: number[] | null;
  noiseScale: number;
  enableAudio: boolean;
  stylePreset: StylePreset;
  characterRefs: CharacterReference[];
}

export interface WorldConfig {
  interactionType: InteractionType;
  name: string;
  prompt: string;
  generation: GenerationSettings;
}

export interface WorldSnapshot extends WorldConfig {
  id: string;
  createdAt: string;
}

export interface SceneSnapshot {
  id: string;
  versionId: string;
  version: number;
  versionSceneSequence: number;
  sequence: number;
  parentSceneId: string | null;
  sourceOptionId: string | null;
  prompt: string;
  previewUrl: string;
  continuityImageUrl: string | null;
  mediaType: 'none' | 'image' | 'video';
  contextSummary: string;
  options: SceneOptionSnapshot[];
  interactiveRegions?: InteractiveRegionSnapshot[];
  generatedAt: string;
  generationLatencyMs: number;
}

export interface SceneOptionSnapshot {
  id: string;
  label: string;
  title: string;
  votes: number;
  regionId?: string | null;
}

export interface InteractiveRegionSnapshot {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  optionIds: string[];
}

export interface RunMetrics {
  sceneCount: number;
  generationLatencyMs: number;
  averageGenerationLatencyMs: number;
  currentPrompt: string;
  queueDepth: number;
  outputFps: number;
  uptimeSeconds: number;
  outputState: ConnectionState | 'starting';
  outputReconnects: number;
  outputError: string | null;
  chatState: ConnectionState;
  chatQueueDepth: number;
  chatReconnects: number;
  history: RunMetricsSample[];
}

export interface RunMetricsSample {
  timestamp: string;
  sceneCount: number;
  generationLatencyMs: number;
  averageGenerationLatencyMs: number;
  queueDepth: number;
  outputFps: number;
  uptimeSeconds: number;
  outputState: ConnectionState | 'starting';
  outputReconnects: number;
  chatState: ConnectionState;
  chatQueueDepth: number;
  chatReconnects: number;
}

export interface RunVersionSnapshot {
  id: string;
  version: number;
  generation: GenerationSettings;
  latestSceneId: string | null;
  lastActivityAt: string | null;
}

export interface GenerationTaskSnapshot {
  sourceSceneId: string | null;
  optionId: string | null;
  startedAt: string;
}

export interface RunSnapshot {
  id: string;
  worldId: string;
  version: number;
  versions: RunVersionSnapshot[];
  revision: number;
  state: RunState;
  sceneCount: number;
  currentScene: SceneSnapshot | null;
  generationTask: GenerationTaskSnapshot | null;
  lastError: string | null;
  metrics: RunMetrics;
  startedAt: string | null;
  stoppedAt: string | null;
  output: LiveOutputSnapshot | null;
  scenes: SceneSnapshot[];
  generationHistory: GenerationHistorySnapshot[];
}

export interface GenerationHistorySnapshot {
  generationId: number;
  timestamp: string;
  prompt: string;
  negativePrompt: string;
  initialImageUrl: string | null;
  model: string;
  visionModel?: string;
  mode: GenerationMode;
  width: number;
  height: number;
  resolution: GenerationSettings['resolution'];
  aspectRatio: GenerationSettings['aspectRatio'];
  durationSeconds: number;
  frameRate: number;
  numFrames: number;
  strength: number;
  guidanceScale: number;
  seed: number | null;
  timesteps: number[];
  targetFps: number;
  stgScale: number;
  spatioTemporalGuidanceBlocks: number[] | null;
  noiseScale: number;
  enableAudio: boolean;
  stylePreset: StylePreset;
  characterRefs: CharacterReference[];
  selectedComment: string | null;
}

export interface CreateWorldRequest {
  world: WorldConfig;
}

export interface ProviderSettings {
  falApiKeyConfigured: boolean;
  googleApiKeyConfigured: boolean;
  defaultStylePreset: StylePreset;
  twitchChannel: string;
  twitchUsername: string;
  chatLookback: number;
  twitchStreamKeyConfigured: boolean;
  twitchOauthTokenConfigured: boolean;
}

export interface UpdateProviderSettingsRequest {
  falApiKey?: string;
  googleApiKey?: string;
  defaultStylePreset: StylePreset;
  twitchChannel: string;
  twitchUsername: string;
  chatLookback: number;
  twitchStreamKey?: string;
  twitchOauthToken?: string;
}

export type ProviderSettingsResponse = ProviderSettings;

export interface WorldResponse {
  world: WorldSnapshot;
  run: RunSnapshot;
  providerApiKeyConfigured: boolean;
}

export interface WorldListResponse {
  worlds: WorldSnapshot[];
  activeWorldId: string | null;
  providerApiKeyConfigured: boolean;
}

export interface DeleteWorldResponse {
  deletedWorldId: string;
  activeWorld: WorldResponse | null;
}

export type LivePlatform = 'youtube' | 'twitch' | 'custom';
export type LiveOutputMode = 'rtmp' | 'webrtc';
export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'stopped'
  | 'failed';

export interface LiveOutputSettings {
  mode: LiveOutputMode;
  platform: LivePlatform;
  endpoint: string;
  streamKey: string;
  title: string;
}

export interface LiveOutputSnapshot {
  mode: LiveOutputMode;
  platform: LivePlatform;
  endpoint: string;
  title: string;
  configured: boolean;
}

export interface StartRunRequest {
  output?: LiveOutputSettings;
  outputMode?: LiveOutputMode;
  model?: string;
  visionModel?: string;
  initialPrompt?: string;
  initialImageUrl?: string | null;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numFrames?: number;
  frameRate?: number;
  strength?: number;
  guidanceScale?: number;
  timesteps?: number[];
  stgScale?: number;
  spatioTemporalGuidanceBlocks?: number[] | null;
  noiseScale?: number;
  seed?: number | null;
  durationSeconds?: number;
  resolution?: GenerationSettings['resolution'];
  aspectRatio?: GenerationSettings['aspectRatio'];
  targetFps?: number;
  mode?: GenerationMode;
  enableAudio?: boolean;
  stylePreset?: StylePreset;
  characterRefs?: CharacterReference[];
}

export interface UpdateRunConfigRequest {
  model?: string;
  visionModel?: string;
  mode?: GenerationMode;
  width?: number;
  height?: number;
  durationSeconds?: number;
  frameRate?: number;
  guidanceScale?: number;
  strength?: number;
  seed?: number | null;
  negativePrompt?: string;
  initialImageUrl?: string | null;
  numFrames?: number;
  timesteps?: number[];
  targetFps?: number;
  stgScale?: number;
  spatioTemporalGuidanceBlocks?: number[] | null;
  resolution?: GenerationSettings['resolution'];
  aspectRatio?: GenerationSettings['aspectRatio'];
  noiseScale?: number;
  enableAudio?: boolean;
  stylePreset?: StylePreset;
  characterRefs?: CharacterReference[] | null;
}

export interface ChooseSceneOptionRequest {
  sceneId?: string;
  optionId: string;
}

export interface SubmitInteractionRequest {
  sceneId?: string;
  input: string;
}

export interface RunResponse {
  run: RunSnapshot;
}

export interface RunMetricsResponse {
  runId: string;
  state: RunState;
  sampledAt: string;
  metrics: RunMetrics;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export type RealtimeEvent =
  | {
      type: 'snapshot';
      world: WorldSnapshot | null;
      run: RunSnapshot | null;
      providerApiKeyConfigured: boolean;
    }
  | { type: 'run.status'; run: RunSnapshot }
  | { type: 'scene.ready'; run: RunSnapshot; scene: SceneSnapshot }
  | { type: 'scene.deleted'; run: RunSnapshot; sceneIds: string[] }
  | { type: 'version.deleted'; run: RunSnapshot; versionId: string; sceneIds: string[] }
  | { type: 'run.error'; run: RunSnapshot; message: string };

export const DEFAULT_GENERATION: GenerationSettings = {
  model: 'none',
  visionModel: 'none',
  mode: 'regular',
  width: 512,
  height: 384,
  durationSeconds: 13,
  frameRate: 9,
  resolution: null,
  aspectRatio: null,
  guidanceScale: 2,
  seed: null,
  negativePrompt:
    'worst quality, inconsistent motion, blurry, jittery, distorted, static scene, frozen frame, no motion, repetitive, looping',
  initialImageUrl: null,
  numFrames: 121,
  strength: 1,
  timesteps: [1000, 993, 987, 981, 975, 909, 725, 0.03],
  targetFps: 9,
  stgScale: 0,
  spatioTemporalGuidanceBlocks: null,
  noiseScale: 0.03,
  enableAudio: true,
  stylePreset: 'cohesive',
  characterRefs: [],
};
