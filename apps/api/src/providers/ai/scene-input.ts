import type { GenerationInput } from '../../types.js';

export function initialImageForScene(input: GenerationInput) {
  if (input.run.scenes.length > 0) return null;
  return input.generation.initialImageUrl?.trim() || null;
}
