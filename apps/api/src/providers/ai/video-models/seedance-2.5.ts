import type { GenerationInput } from '../../../types.js';

export interface Seedance25Input {
  prompt: string;
  duration: string;
  image_url?: string;
}

export function seedance25Input(
  input: GenerationInput,
  prompt: string,
  initialImage: string | null,
): Seedance25Input {
  return {
    prompt,
    duration: String(input.generation.durationSeconds),
    ...(initialImage ? { image_url: initialImage } : {}),
  };
}
