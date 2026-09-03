import type {
  GenerationSettings,
  LiveOutputSettings,
  ProviderSettings,
  RunSnapshot,
  SceneSnapshot,
  WorldSnapshot,
} from '@infinite-world/api-contract';

export interface ProviderSecrets {
  falApiKey: string | null;
  openaiApiKey: string | null;
  groqApiKey: string | null;
  twitchStreamKey: string | null;
  twitchOauthToken: string | null;
}

export interface ProviderState extends ProviderSecrets {
  defaultModel: string;
  llmTextModel: string;
  llmVisionModel: string;
  llmTemperature: number;
  defaultStylePreset: ProviderSettings['defaultStylePreset'];
  twitchChannel: string;
  twitchUsername: string;
  chatLookback: number;
}

export type StoredRun = RunSnapshot & {
  outputSettings?: LiveOutputSettings | null;
  pendingDirection?: string | null;
  continuityImageUrl?: string | null;
};

export interface PersistedState {
  worlds: WorldSnapshot[];
  activeWorldId: string | null;
  runs: StoredRun[];
  provider: Partial<ProviderState> & {
    providerApiKey?: string | null;
  };
}

export interface RunStartInput {
  output?: LiveOutputSettings;
  outputMode?: LiveOutputSettings['mode'];
  model?: string;
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
  llmTemperature?: number;
}

export interface RunConfigInput extends Partial<GenerationSettings> {
  llmTemperature?: number;
}

export interface GenerationInput {
  world: WorldSnapshot;
  run: StoredRun;
  generation: GenerationSettings;
  branchDirection: string | null;
}

export interface GeneratedScene {
  prompt: string;
  contextSummary: string;
  previewUrl: string;
  mediaType: SceneSnapshot['mediaType'];
  continuityImageUrl?: string | null;
  generationLatencyMs: number;
  selectedComment?: string | null;
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
  | { type: 'run.error'; run: RunSnapshot; message: string };
