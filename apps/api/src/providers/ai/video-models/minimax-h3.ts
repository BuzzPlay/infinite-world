import type { GenerationInput } from '../../../types.js';

type MinimaxH3Resolution = '480P' | '768P' | '2K' | '4K';
type MinimaxH3AspectRatio = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16';

export interface MinimaxH3Input {
  prompt: string;
  duration: number;
  resolution: MinimaxH3Resolution;
  prompt_expansion_mode: null;
  seed?: number;
  image_url?: string;
  aspect_ratio?: MinimaxH3AspectRatio;
}

export function minimaxH3Input(
  input: GenerationInput,
  prompt: string,
  initialImage: string | null,
): MinimaxH3Input {
  const resolution = isMinimaxH3Resolution(input.generation.resolution)
    ? input.generation.resolution
    : '2K';
  const aspectRatio = isMinimaxH3AspectRatio(input.generation.aspectRatio)
    ? input.generation.aspectRatio
    : '16:9';
  return {
    prompt,
    duration: input.generation.durationSeconds,
    resolution,
    prompt_expansion_mode: null,
    ...(input.generation.seed === null ? {} : { seed: input.generation.seed }),
    ...(initialImage ? { image_url: initialImage } : { aspect_ratio: aspectRatio }),
  };
}

function isMinimaxH3Resolution(
  value: GenerationInput['generation']['resolution'],
): value is MinimaxH3Resolution {
  return value === '480P' || value === '768P' || value === '2K' || value === '4K';
}

function isMinimaxH3AspectRatio(
  value: GenerationInput['generation']['aspectRatio'],
): value is MinimaxH3AspectRatio {
  return (
    value === '21:9' ||
    value === '16:9' ||
    value === '4:3' ||
    value === '1:1' ||
    value === '3:4' ||
    value === '9:16'
  );
}
