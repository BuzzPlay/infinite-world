import { DEFAULT_GENERATION } from '@infinite-world/api-contract';
import type { GenerationSettings, WorldConfig, WorldSnapshot } from '@infinite-world/api-contract';

import { ApiError } from '../shared/errors.js';
import type { ProviderState, RunConfigInput, RunStartInput } from '../types.js';

export const generationModels = new Set([
  'demo-continuous',
  'fal-ltx-video',
  'fal-ltx-2.3',
  'ltx-2.3',
  'ltxv1',
  'ltx-2.3-local',
  'ltx-2.3-condition',
]);

export const generationModes = new Set(['regular', 'nightmare', 'cohesive', 'visual', 'chaotic']);
export const stylePresets = new Set(['cohesive', 'chaotic', 'nightmare', 'custom']);

export function makeWorld(
  input: WorldConfig | null | undefined,
  provider: ProviderState,
  id: string = crypto.randomUUID(),
  createdAt = new Date().toISOString(),
): WorldSnapshot {
  if (!input || typeof input !== 'object') throw new ApiError(400, 'invalid_world', 'world is required');
  const name = input.name?.trim();
  const prompt = input.prompt?.trim();
  if (!name) throw new ApiError(400, 'invalid_world', 'name is required');
  if (!prompt) throw new ApiError(400, 'invalid_world', 'prompt is required');
  const generation = normalizeGeneration({ ...DEFAULT_GENERATION, ...(input.generation ?? {}) });
  if (!generation.model) generation.model = provider.defaultModel;
  validateGeneration(generation);
  return { id, name, prompt, generation, createdAt };
}

export function normalizeGeneration(input: Partial<GenerationSettings> | null | undefined): GenerationSettings {
  return {
    ...DEFAULT_GENERATION,
    ...(input ?? {}),
    resolution: input?.resolution ?? null,
    aspectRatio: input?.aspectRatio ?? null,
    initialImageUrl: input?.initialImageUrl ?? null,
    seed: input?.seed ?? null,
    spatioTemporalGuidanceBlocks: input?.spatioTemporalGuidanceBlocks ?? null,
    characterRefs: Array.isArray(input?.characterRefs) ? input.characterRefs : [],
  };
}

export function applyGenerationInput(base: GenerationSettings, input: RunStartInput | RunConfigInput) {
  const next = normalizeGeneration({
    ...base,
    ...(input.model !== undefined ? { model: input.model } : {}),
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
    ...(input.spatioTemporalGuidanceBlocks !== undefined ? { spatioTemporalGuidanceBlocks: input.spatioTemporalGuidanceBlocks } : {}),
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
  if (!generationModels.has(generation.model)) throw new ApiError(400, 'invalid_model', `unsupported model: ${generation.model}`);
  if (!generationModes.has(generation.mode)) throw new ApiError(400, 'invalid_mode', `unsupported generation mode: ${generation.mode}`);
  if (!stylePresets.has(generation.stylePreset)) throw new ApiError(400, 'invalid_style_preset', `unsupported style preset: ${generation.stylePreset}`);
  if (!Number.isInteger(generation.width) || generation.width < 256 || generation.width > 4096 || generation.width % 32 !== 0) throw new ApiError(400, 'invalid_width', 'width must be divisible by 32 and between 256 and 4096');
  if (!Number.isInteger(generation.height) || generation.height < 144 || generation.height > 4096 || generation.height % 32 !== 0) throw new ApiError(400, 'invalid_height', 'height must be divisible by 32 and between 144 and 4096');
  if (!Number.isFinite(generation.durationSeconds) || generation.durationSeconds < 1 || generation.durationSeconds > 60) throw new ApiError(400, 'invalid_duration', 'durationSeconds must be between 1 and 60');
  if (!Number.isFinite(generation.frameRate) || generation.frameRate < 1 || generation.frameRate > 60) throw new ApiError(400, 'invalid_frame_rate', 'frameRate must be between 1 and 60');
  if (!Number.isInteger(generation.numFrames) || generation.numFrames < 9 || generation.numFrames > 1001) throw new ApiError(400, 'invalid_num_frames', 'numFrames must be between 9 and 1001');
  if (generation.characterRefs.length > 4) throw new ApiError(400, 'invalid_character_refs', 'characterRefs cannot contain more than four references');
}

export function validateTemperature(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 2) throw new ApiError(400, 'invalid_llm_temperature', 'llmTemperature must be between 0 and 2');
}

export function isHostedGenerationModel(model: string) {
  return model === 'fal-ltx-video' || model === 'fal-ltx-2.3' || model === 'ltx-2.3';
}

export function normalizeStoredWorld(world: WorldSnapshot): WorldSnapshot {
  return { ...world, generation: normalizeGeneration(world.generation) };
}
