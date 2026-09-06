import type {
  GenerationSettings,
  InteractionType,
  LiveOutputSettings,
  ProviderSettings,
  RunSnapshot,
  SceneOptionSnapshot,
  SceneSnapshot,
  WorldSnapshot,
} from '@infinite-world/api-contract';

export interface ProviderSecrets {
  falApiKey: string | null;
  googleApiKey: string | null;
  twitchStreamKey: string | null;
  twitchOauthToken: string | null;
}

export interface ProviderState extends ProviderSecrets {
  defaultStylePreset: ProviderSettings['defaultStylePreset'];
  twitchChannel: string;
  twitchUsername: string;
  chatLookback: number;
}

export type StoredRun = RunSnapshot & {
  outputSettings: LiveOutputSettings | null;
  pendingBranch: PendingBranch | null;
  continuityImageUrl: string | null;
};

export interface PendingBranch {
  sceneId: string;
  optionId: string | null;
  direction: string;
}

export interface RuntimeSnapshot {
  worlds: WorldSnapshot[];
  activeWorldId: string | null;
  runs: StoredRun[];
  provider: Partial<ProviderState>;
}

export interface ProjectIndexEntry {
  id: string;
  name: string;
  interactionType: InteractionType;
  createdAt: string;
}

export interface PersistedRootState {
  schemaVersion: 1;
  activeProjectId: string | null;
  projects: ProjectIndexEntry[];
  provider: Partial<ProviderState>;
}

export interface VersionIndexEntry {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersistedProjectState {
  activeVersionId: string;
  versions: VersionIndexEntry[];
}

export interface RunStartInput {
  output?: LiveOutputSettings;
  outputMode?: LiveOutputSettings['mode'];
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
  mode?: GenerationSettings['mode'];
  enableAudio?: boolean;
  stylePreset?: GenerationSettings['stylePreset'];
  characterRefs?: GenerationSettings['characterRefs'];
}

export type RunConfigInput = Partial<GenerationSettings>;

export interface GenerationInput {
  world: WorldSnapshot;
  run: StoredRun;
  generation: GenerationSettings;
  parentSceneId: string | null;
  sourceOptionId: string | null;
  branchDirection: string | null;
}

export interface GeneratedScene {
  prompt: string;
  contextSummary: string;
  previewUrl: string;
  mediaType: SceneSnapshot['mediaType'];
  options?: SceneOptionSnapshot[];
  interactiveRegions?: GeneratedInteractiveRegion[];
  continuityImageUrl?: string | null;
  sourceContinuityImageUrl?: string | null;
  generationLatencyMs: number;
  selectedComment?: string | null;
}

export interface GeneratedInteractiveRegion {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  options: string[];
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
