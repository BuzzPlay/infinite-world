export const MODEL_CAPABILITIES = ['vision', 'video'] as const;
export type ModelCapability = (typeof MODEL_CAPABILITIES)[number];

export const GOOGLE_MODEL = 'google/gemini-2.5-flash';
export const GOOGLE_FLASH_LITE_MODEL = 'google/gemini-2.5-flash-lite';
export const FAL_GEMINI_MODEL = 'fal/google/gemini-2.5-flash';
export const FAL_GEMINI_FLASH_LITE_MODEL = 'fal/google/gemini-2.5-flash-lite';
export const OPENAI_GPT_56_SOL_MODEL = 'openai/gpt-5.6-sol';
export const OPENAI_GPT_6_ASTRA_MODEL = 'openai/gpt-6-astra';
export const LTX_23_FAST_VIDEO_MODEL = 'fal/ltx-2.3-fast';
export const LTX_23_FAST_TEXT_ENDPOINT = 'fal-ai/ltx-2.3/text-to-video/fast';
export const LTX_23_FAST_IMAGE_ENDPOINT = 'fal-ai/ltx-2.3/image-to-video/fast';
export const MINIMAX_H3_VIDEO_MODEL = 'fal/minimax-h3';
export const MINIMAX_H3_TEXT_ENDPOINT = 'minimax/h3/text-to-video';
export const MINIMAX_H3_IMAGE_ENDPOINT = 'minimax/h3/image-to-video';
export const SEEDANCE_25_VIDEO_MODEL = 'fal/seedance-2.5';
export const SEEDANCE_25_TEXT_ENDPOINT = 'bytedance/seedance-2.5/text-to-video';
export const SEEDANCE_25_IMAGE_ENDPOINT = 'bytedance/seedance-2.5/image-to-video';
export const DEFAULT_VISION_MODEL = GOOGLE_MODEL;
export const DEFAULT_VIDEO_MODEL = LTX_23_FAST_VIDEO_MODEL;

export type ModelProvider = 'none' | 'google' | 'openai' | 'fal';
export type ModelApiKey = null | 'googleApiKey' | 'openaiApiKey' | 'falApiKey';
export type VideoInputMode = 'text-to-video' | 'image-to-video';
export type VideoResolution = '480P' | '720p' | '768P' | '2K' | '4K' | '1080p' | '1440p' | '2160p';
export type VideoAspectRatio = 'auto' | '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16';

export interface VideoModelProfile {
  /** Every selectable video model must support both a fresh scene and continuation input. */
  endpoints: Record<VideoInputMode, string>;
  durations: readonly number[];
  frameRates: readonly number[];
  resolutions: readonly VideoResolution[];
  aspectRatios: readonly VideoAspectRatio[];
  supportsFrameRateControl: boolean;
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
  openaiApiKeyConfigured: boolean;
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
    {
      id: OPENAI_GPT_56_SOL_MODEL,
      label: 'GPT-5.6 Sol',
      provider: 'openai',
      modelId: 'gpt-5.6-sol',
      apiKey: 'openaiApiKey',
    },
    {
      id: OPENAI_GPT_6_ASTRA_MODEL,
      label: 'GPT-6 Astra',
      provider: 'openai',
      modelId: 'gpt-6-astra',
      apiKey: 'openaiApiKey',
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
        supportsFrameRateControl: true,
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
    {
      id: MINIMAX_H3_VIDEO_MODEL,
      label: 'MiniMax H3',
      provider: 'fal',
      modelId: null,
      apiKey: 'falApiKey',
      video: {
        endpoints: {
          'text-to-video': MINIMAX_H3_TEXT_ENDPOINT,
          'image-to-video': MINIMAX_H3_IMAGE_ENDPOINT,
        },
        durations: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        frameRates: [24],
        resolutions: ['480P', '768P', '2K', '4K'],
        aspectRatios: ['auto', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
        supportsFrameRateControl: false,
        supportsAudio: false,
        defaults: {
          durationSeconds: 5,
          frameRate: 24,
          resolution: '480P',
          aspectRatio: '16:9',
          enableAudio: false,
        },
      },
    },
    {
      id: SEEDANCE_25_VIDEO_MODEL,
      label: 'Seedance 2.5',
      provider: 'fal',
      modelId: null,
      apiKey: 'falApiKey',
      video: {
        endpoints: {
          'text-to-video': SEEDANCE_25_TEXT_ENDPOINT,
          'image-to-video': SEEDANCE_25_IMAGE_ENDPOINT,
        },
        durations: [4, 5, 6, 8, 10, 15, 20, 30],
        frameRates: [24],
        resolutions: ['720p'],
        aspectRatios: ['auto'],
        supportsFrameRateControl: false,
        supportsAudio: false,
        defaults: {
          durationSeconds: 5,
          frameRate: 24,
          resolution: '720p',
          aspectRatio: 'auto',
          enableAudio: false,
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
  const models = MODEL_CATALOG[capability];
  if (capability !== 'video') return models;
  return models.filter(
    (model) =>
      model.provider === 'none' ||
      ('video' in model && Boolean(model.video.endpoints['image-to-video'])),
  );
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
  if (model.apiKey === 'googleApiKey') return configuration.googleApiKeyConfigured;
  if (model.apiKey === 'openaiApiKey') return configuration.openaiApiKeyConfigured;
  return configuration.falApiKeyConfigured;
}

export function defaultVisionModelFor(
  googleApiKeyConfigured: boolean,
  openaiApiKeyConfigured: boolean,
  falApiKeyConfigured: boolean,
) {
  if (googleApiKeyConfigured) return DEFAULT_VISION_MODEL;
  if (openaiApiKeyConfigured) return OPENAI_GPT_56_SOL_MODEL;
  if (falApiKeyConfigured) return FAL_GEMINI_MODEL;
  return 'none';
}
