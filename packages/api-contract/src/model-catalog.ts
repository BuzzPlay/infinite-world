export const MODEL_CAPABILITIES = ['vision', 'video'] as const;
export type ModelCapability = (typeof MODEL_CAPABILITIES)[number];

export const GOOGLE_MODEL = 'google/gemini-2.5-flash';
export const GOOGLE_FLASH_LITE_MODEL = 'google/gemini-2.5-flash-lite';
export const FAL_GEMINI_MODEL = 'fal/google/gemini-2.5-flash';
export const FAL_GEMINI_FLASH_LITE_MODEL = 'fal/google/gemini-2.5-flash-lite';
export const LTX_23_FAST_VIDEO_MODEL = 'fal/ltx-2.3-fast';
export const LTX_23_FAST_TEXT_ENDPOINT = 'fal-ai/ltx-2.3/text-to-video/fast';
export const LTX_23_FAST_IMAGE_ENDPOINT = 'fal-ai/ltx-2.3/image-to-video/fast';
export const DEFAULT_VISION_MODEL = GOOGLE_MODEL;
export const DEFAULT_VIDEO_MODEL = LTX_23_FAST_VIDEO_MODEL;

export type ModelProvider = 'none' | 'google' | 'fal';
export type ModelApiKey = null | 'googleApiKey' | 'falApiKey';
export type VideoInputMode = 'text-to-video' | 'image-to-video';
export type VideoResolution = '1080p' | '1440p' | '2160p';
export type VideoAspectRatio = 'auto' | '16:9' | '9:16';

export interface VideoModelProfile {
  endpoints: Partial<Record<VideoInputMode, string>>;
  durations: readonly number[];
  frameRates: readonly number[];
  resolutions: readonly VideoResolution[];
  aspectRatios: readonly VideoAspectRatio[];
  supportsAudio: boolean;
  defaults: {
    durationSeconds: number;
    frameRate: number;
    resolution: VideoResolution;
    aspectRatio: VideoAspectRatio;
    enableAudio: boolean;
  };
  longDuration?: {
    aboveSeconds: number;
    frameRate: number;
    resolution: VideoResolution;
  };
}

export interface ModelProviderConfiguration {
  googleApiKeyConfigured: boolean;
  falApiKeyConfigured: boolean;
}

export interface ModelDefinition {
  id: string;
  label: string;
  provider: ModelProvider;
  modelId: string | null;
  apiKey: ModelApiKey;
  video?: VideoModelProfile;
}

export const MODEL_CATALOG = {
  vision: [
    { id: 'none', label: 'None', provider: 'none', modelId: null, apiKey: null },
    {
      id: GOOGLE_MODEL,
      label: 'Gemini 2.5 Flash',
      provider: 'google',
      modelId: 'gemini-2.5-flash',
      apiKey: 'googleApiKey',
    },
    {
      id: GOOGLE_FLASH_LITE_MODEL,
      label: 'Gemini 2.5 Flash-Lite',
      provider: 'google',
      modelId: 'gemini-2.5-flash-lite',
      apiKey: 'googleApiKey',
    },
    {
      id: FAL_GEMINI_MODEL,
      label: 'Gemini 2.5 Flash',
      provider: 'fal',
      modelId: 'google/gemini-2.5-flash',
      apiKey: 'falApiKey',
    },
    {
      id: FAL_GEMINI_FLASH_LITE_MODEL,
      label: 'Gemini 2.5 Flash-Lite',
      provider: 'fal',
      modelId: 'google/gemini-2.5-flash-lite',
      apiKey: 'falApiKey',
    },
  ],
  video: [
    { id: 'none', label: 'None', provider: 'none', modelId: null, apiKey: null },
    {
      id: LTX_23_FAST_VIDEO_MODEL,
      label: 'LTX 2.3 Fast',
      provider: 'fal',
      modelId: null,
      apiKey: 'falApiKey',
      video: {
        endpoints: {
          'text-to-video': LTX_23_FAST_TEXT_ENDPOINT,
          'image-to-video': LTX_23_FAST_IMAGE_ENDPOINT,
        },
        durations: [6, 8, 10, 12, 14, 16, 18, 20],
        frameRates: [24, 25, 48, 50],
        resolutions: ['1080p', '1440p', '2160p'],
        aspectRatios: ['auto', '16:9', '9:16'],
        supportsAudio: true,
        defaults: {
          durationSeconds: 6,
          frameRate: 25,
          resolution: '1080p',
          aspectRatio: '16:9',
          enableAudio: true,
        },
        longDuration: {
          aboveSeconds: 10,
          frameRate: 25,
          resolution: '1080p',
        },
      },
    },
  ],
} as const satisfies Record<ModelCapability, readonly ModelDefinition[]>;

const LEGACY_VIDEO_MODELS = new Set([
  'fal-ai/ltx-video',
  'fal-ai/ltx-video/image-to-video',
  LTX_23_FAST_TEXT_ENDPOINT,
  LTX_23_FAST_IMAGE_ENDPOINT,
]);

export function modelsForCapability(capability: ModelCapability): readonly ModelDefinition[] {
  return MODEL_CATALOG[capability];
}

export function findModel(capability: ModelCapability, id: string): ModelDefinition | undefined {
  const normalizedId = capability === 'video' ? normalizeVideoModelId(id) : id;
  return modelsForCapability(capability).find((model) => model.id === normalizedId);
}

export function normalizeVideoModelId(id: string) {
  return LEGACY_VIDEO_MODELS.has(id) ? LTX_23_FAST_VIDEO_MODEL : id;
}

export function videoEndpointFor(modelId: string, inputMode: VideoInputMode) {
  return findModel('video', modelId)?.video?.endpoints[inputMode] ?? null;
}

export function videoProfileFor(modelId: string) {
  return findModel('video', modelId)?.video ?? null;
}

export function isFalVideoModel(id: string) {
  const model = findModel('video', id);
  return model?.provider === 'fal';
}

export function isModelConfigured(
  capability: ModelCapability,
  id: string,
  configuration: ModelProviderConfiguration,
) {
  const model = findModel(capability, id);
  if (!model) return false;
  if (model.apiKey === null) return true;
  return model.apiKey === 'googleApiKey'
    ? configuration.googleApiKeyConfigured
    : configuration.falApiKeyConfigured;
}

export function defaultVisionModelFor(
  googleApiKeyConfigured: boolean,
  falApiKeyConfigured: boolean,
) {
  if (googleApiKeyConfigured) return DEFAULT_VISION_MODEL;
  if (falApiKeyConfigured) return FAL_GEMINI_MODEL;
  return 'none';
}
