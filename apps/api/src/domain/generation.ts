import type {
  GenerationSettings,
  InteractionType,
  WorldConfig,
  WorldSnapshot,
} from '@infinite-world/api-contract';
import { DEFAULT_GENERATION } from '@infinite-world/api-contract';
import {
  DEFAULT_VIDEO_MODEL,
  DEFAULT_VISION_MODEL,
  FAL_GEMINI_MODEL,
  findModel,
  isFalVideoModel,
  MODEL_CATALOG,
  normalizeVideoModelId,
  videoEndpointFor,
  videoProfileFor,
} from '@infinite-world/api-contract/model-catalog';

import { ApiError } from '../shared/errors.js';
import type { ProviderState, RunConfigInput, RunStartInput } from '../types.js';

export const generationModels = new Set<string>(MODEL_CATALOG.video.map((model) => model.id));
export const visionModels = new Set<string>(MODEL_CATALOG.vision.map((model) => model.id));

export const generationModes = new Set(['regular', 'nightmare', 'cohesive', 'visual', 'chaotic']);
export const stylePresets = new Set(['cohesive', 'chaotic', 'nightmare', 'custom']);
export const interactionTypes = new Set<InteractionType>(['text', 'voice', 'image']);

export function makeWorld(
  input: WorldConfig | null | undefined,
  provider: ProviderState,
  id: string = crypto.randomUUID(),
  createdAt = new Date().toISOString(),
): WorldSnapshot {
  if (!input || typeof input !== 'object')
    throw new ApiError(400, 'invalid_world', 'world is required');
  const name = input.name?.trim();
  const prompt = input.prompt?.trim();
  if (!interactionTypes.has(input.interactionType)) {
    throw new ApiError(
      400,
      'invalid_interaction_type',
      `unsupported interaction type: ${String(input.interactionType)}`,
    );
  }
  if (!name) throw new ApiError(400, 'invalid_world', 'name is required');
  if (!prompt) throw new ApiError(400, 'invalid_world', 'prompt is required');
  const generationInput = input.generation ?? {};
  let generation = normalizeGeneration(generationInput);
  if (!generationInput.visionModel?.trim()) {
    generation.visionModel = provider.googleApiKey
      ? DEFAULT_VISION_MODEL
      : provider.falApiKey
        ? FAL_GEMINI_MODEL
        : 'none';
  }
  if (!generationInput.model?.trim()) {
    generation.model = provider.falApiKey ? DEFAULT_VIDEO_MODEL : 'none';
  }
  generation = normalizeVideoSettings(generation);
  validateGeneration(generation);
  if (!isVisionModelConfigured(generation.visionModel, provider)) {
    throw new ApiError(
      400,
      'missing_vision_provider_key',
      'configure the selected vision provider before selecting this model',
    );
  }
  if (isHostedGenerationModel(generation.model) && !provider.falApiKey) {
    throw new ApiError(
      400,
      'missing_provider_key',
      'configure a provider key before selecting hosted generation',
    );
  }
  return { id, interactionType: input.interactionType, name, prompt, generation, createdAt };
}

export function normalizeGeneration(
  input: Partial<GenerationSettings> | null | undefined,
): GenerationSettings {
  return normalizeVideoSettings({
    ...DEFAULT_GENERATION,
    ...(input ?? {}),
    model: normalizeVideoModelId(input?.model ?? DEFAULT_GENERATION.model),
    visionModel: input?.visionModel ?? DEFAULT_GENERATION.visionModel,
    resolution: input?.resolution ?? null,
    aspectRatio: input?.aspectRatio ?? null,
    initialImageUrl: input?.initialImageUrl ?? null,
    seed: input?.seed ?? null,
    spatioTemporalGuidanceBlocks: input?.spatioTemporalGuidanceBlocks ?? null,
    characterRefs: Array.isArray(input?.characterRefs) ? input.characterRefs : [],
  });
}

export function applyGenerationInput(
  base: GenerationSettings,
  input: RunStartInput | RunConfigInput,
) {
  const next = normalizeGeneration({
    ...base,
    ...(input.model !== undefined ? { model: input.model } : {}),
    ...(input.visionModel !== undefined ? { visionModel: input.visionModel } : {}),
    ...(input.mode !== undefined ? { mode: input.mode } : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
    ...(input.durationSeconds !== undefined ? { durationSeconds: input.durationSeconds } : {}),
    ...(input.frameRate !== undefined ? { frameRate: input.frameRate } : {}),
    ...(input.guidanceScale !== undefined ? { guidanceScale: input.guidanceScale } : {}),
    ...(input.strength !== undefined ? { strength: input.strength } : {}),
    ...(input.seed !== undefined ? { seed: input.seed } : {}),
    ...(input.negativePrompt !== undefined ? { negativePrompt: input.negativePrompt } : {}),
    ...(input.initialImageUrl !== undefined ? { initialImageUrl: input.initialImageUrl } : {}),
    ...(input.numFrames !== undefined ? { numFrames: input.numFrames } : {}),
    ...(input.timesteps !== undefined ? { timesteps: input.timesteps } : {}),
    ...(input.targetFps !== undefined ? { targetFps: input.targetFps } : {}),
    ...(input.stgScale !== undefined ? { stgScale: input.stgScale } : {}),
    ...(input.spatioTemporalGuidanceBlocks !== undefined
      ? { spatioTemporalGuidanceBlocks: input.spatioTemporalGuidanceBlocks }
      : {}),
    ...(input.resolution !== undefined ? { resolution: input.resolution } : {}),
    ...(input.aspectRatio !== undefined ? { aspectRatio: input.aspectRatio } : {}),
    ...(input.noiseScale !== undefined ? { noiseScale: input.noiseScale } : {}),
    ...(input.enableAudio !== undefined ? { enableAudio: input.enableAudio } : {}),
    ...(input.stylePreset !== undefined ? { stylePreset: input.stylePreset } : {}),
    ...(input.characterRefs !== undefined ? { characterRefs: input.characterRefs ?? [] } : {}),
  });
  validateGeneration(next);
  return next;
}

export function validateGeneration(generation: GenerationSettings) {
  if (!generationModels.has(generation.model))
    throw new ApiError(400, 'invalid_model', `unsupported model: ${generation.model}`);
  const videoInputMode = generation.initialImageUrl?.trim() ? 'image-to-video' : 'text-to-video';
  if (generation.model !== 'none' && !videoEndpointFor(generation.model, videoInputMode)) {
    throw new ApiError(
      400,
      'invalid_model_input',
      `video model ${generation.model} does not support ${videoInputMode}`,
    );
  }
  if (!visionModels.has(generation.visionModel))
    throw new ApiError(
      400,
      'invalid_vision_model',
      `unsupported vision model: ${generation.visionModel}`,
    );
  if (!generationModes.has(generation.mode))
    throw new ApiError(400, 'invalid_mode', `unsupported generation mode: ${generation.mode}`);
  if (!stylePresets.has(generation.stylePreset))
    throw new ApiError(
      400,
      'invalid_style_preset',
      `unsupported style preset: ${generation.stylePreset}`,
    );
  if (
    !Number.isInteger(generation.width) ||
    generation.width < 256 ||
    generation.width > 4096 ||
    generation.width % 32 !== 0
  )
    throw new ApiError(
      400,
      'invalid_width',
      'width must be divisible by 32 and between 256 and 4096',
    );
  if (
    !Number.isInteger(generation.height) ||
    generation.height < 144 ||
    generation.height > 4096 ||
    generation.height % 32 !== 0
  )
    throw new ApiError(
      400,
      'invalid_height',
      'height must be divisible by 32 and between 144 and 4096',
    );
  if (
    !Number.isFinite(generation.durationSeconds) ||
    generation.durationSeconds < 1 ||
    generation.durationSeconds > 60
  )
    throw new ApiError(400, 'invalid_duration', 'durationSeconds must be between 1 and 60');
  if (
    !Number.isFinite(generation.frameRate) ||
    generation.frameRate < 1 ||
    generation.frameRate > 60
  )
    throw new ApiError(400, 'invalid_frame_rate', 'frameRate must be between 1 and 60');
  if (
    !Number.isInteger(generation.numFrames) ||
    generation.numFrames < 9 ||
    generation.numFrames > 1001
  )
    throw new ApiError(400, 'invalid_num_frames', 'numFrames must be between 9 and 1001');
  if (generation.characterRefs.length > 4)
    throw new ApiError(
      400,
      'invalid_character_refs',
      'characterRefs cannot contain more than four references',
    );
}

export function isHostedGenerationModel(model: string) {
  return isFalVideoModel(model);
}

export function isVisionModelConfigured(model: string, provider: ProviderState) {
  const definition = findModel('vision', model);
  if (!definition) return false;
  if (definition.apiKey === null) return true;
  return definition.apiKey === 'googleApiKey'
    ? Boolean(provider.googleApiKey)
    : Boolean(provider.falApiKey);
}

export function normalizeStoredWorld(world: WorldSnapshot): WorldSnapshot {
  if (!interactionTypes.has(world.interactionType)) {
    throw new Error(`Unsupported stored interaction type: ${String(world.interactionType)}`);
  }
  return { ...world, generation: normalizeGeneration(world.generation) };
}

function normalizeVideoSettings(generation: GenerationSettings): GenerationSettings {
  const profile = videoProfileFor(generation.model);
  if (!profile) return generation;

  const durationSeconds = profile.durations.includes(generation.durationSeconds)
    ? generation.durationSeconds
    : profile.defaults.durationSeconds;
  const longDuration =
    profile.longDuration && durationSeconds > profile.longDuration.aboveSeconds
      ? profile.longDuration
      : null;
  const frameRate = profile.defaults.frameRate;
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
    ...generation,
    durationSeconds,
    frameRate: longDuration?.frameRate ?? frameRate,
    resolution: longDuration?.resolution ?? resolution,
    aspectRatio,
    enableAudio: profile.supportsAudio ? generation.enableAudio : false,
  };
}
