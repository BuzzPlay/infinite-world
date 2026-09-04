import type { GenerationSettings } from '@infinite-world/api-contract';
import {
  modelsForCapability,
  type ModelCapability,
  type ModelProvider,
  videoProfileFor,
} from '@infinite-world/api-contract/model-catalog';

export interface GenerationModelOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type ProviderAvailability = Partial<Record<Exclude<ModelProvider, 'none'>, boolean>>;

export function modelOptionsFor(
  capability: ModelCapability,
  configured: ProviderAvailability,
): GenerationModelOption[] {
  const options: GenerationModelOption[] = [{ value: 'none', label: 'none' }];
  for (const model of modelsForCapability(capability)) {
    if (model.provider !== 'none' && configured[model.provider] === true) {
      options.push({ value: model.id, label: model.id });
    }
  }
  return options;
}

export const hostedGenerationModelOptions = modelOptionsFor('video', { fal: true });
export const generationModelOptions = hostedGenerationModelOptions;

export function generationModelOptionsFor(falApiKeyConfigured: boolean) {
  return modelOptionsFor('video', { fal: falApiKeyConfigured });
}

export function visionModelOptionsFor(
  googleApiKeyConfigured: boolean,
  falApiKeyConfigured: boolean,
) {
  return modelOptionsFor('vision', {
    google: googleApiKeyConfigured,
    fal: falApiKeyConfigured,
  });
}

export function videoModelChanges(
  generation: GenerationSettings,
  model: string,
): Partial<GenerationSettings> {
  const profile = videoProfileFor(model);
  if (!profile) return { model };

  const duration = profile.durations.includes(generation.durationSeconds)
    ? generation.durationSeconds
    : profile.defaults.durationSeconds;
  const longDuration =
    profile.longDuration && duration > profile.longDuration.aboveSeconds
      ? profile.longDuration
      : null;
  const frameRate = profile.frameRates.includes(generation.frameRate)
    ? generation.frameRate
    : profile.defaults.frameRate;
  const resolution =
    generation.resolution && profile.resolutions.includes(generation.resolution)
      ? generation.resolution
      : profile.defaults.resolution;
  const aspectRatio =
    generation.aspectRatio && profile.aspectRatios.includes(generation.aspectRatio)
      ? generation.aspectRatio
      : generation.initialImageUrl
        ? 'auto'
        : profile.defaults.aspectRatio;

  return {
    model,
    durationSeconds: duration,
    frameRate: longDuration?.frameRate ?? frameRate,
    resolution: longDuration?.resolution ?? resolution,
    aspectRatio,
    enableAudio: profile.supportsAudio ? generation.enableAudio : false,
  };
}

export function initialImageChanges(
  generation: GenerationSettings,
  value: string,
): Partial<GenerationSettings> {
  const initialImageUrl = value || null;
  const profile = videoProfileFor(generation.model);
  return {
    initialImageUrl,
    ...(profile ? { aspectRatio: initialImageUrl ? 'auto' : profile.defaults.aspectRatio } : {}),
  };
}
