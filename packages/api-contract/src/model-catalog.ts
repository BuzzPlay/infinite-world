export const MODEL_CAPABILITIES = ['vision', 'video'] as const;
export type ModelCapability = (typeof MODEL_CAPABILITIES)[number];

export const GOOGLE_MODEL = 'google/gemini-2.5-flash';
export const DEFAULT_VISION_MODEL = GOOGLE_MODEL;
export const DEFAULT_VIDEO_MODEL = 'fal-ai/ltx-video';

export type ModelProvider = 'none' | 'google' | 'fal';
export type ModelApiKey = null | 'googleApiKey' | 'falApiKey';

export interface ModelDefinition {
  id: string;
  label: string;
  provider: ModelProvider;
  modelId: string | null;
  apiKey: ModelApiKey;
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
  ],
  video: [
    { id: 'none', label: 'None', provider: 'none', modelId: null, apiKey: null },
    {
      id: 'fal-ai/ltx-video',
      label: 'LTX Video',
      provider: 'fal',
      modelId: 'fal-ai/ltx-video',
      apiKey: 'falApiKey',
    },
    {
      id: 'fal-ai/ltx-2.3/image-to-video/fast',
      label: 'LTX 2.3 Fast',
      provider: 'fal',
      modelId: 'fal-ai/ltx-2.3/image-to-video/fast',
      apiKey: 'falApiKey',
    },
  ],
} as const satisfies Record<ModelCapability, readonly ModelDefinition[]>;

export function modelsForCapability(capability: ModelCapability) {
  return MODEL_CATALOG[capability];
}

export function findModel(capability: ModelCapability, id: string) {
  return modelsForCapability(capability).find((model) => model.id === id);
}

export function isFalVideoModel(id: string) {
  const model = findModel('video', id);
  return model?.provider === 'fal';
}

export function isGoogleVisionModel(id: string) {
  const model = findModel('vision', id);
  return model?.provider === 'google';
}
