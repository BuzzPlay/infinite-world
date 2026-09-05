import type { GenerationInput } from '../../../types.js';

export interface Ltx23FastInput {
  prompt: string;
  duration: number;
  fps: number;
  generate_audio: boolean;
  resolution: '1080p' | '1440p' | '2160p';
  aspect_ratio: 'auto' | '16:9' | '9:16';
  image_url?: string;
}

export function ltx23FastInput(
  input: GenerationInput,
  prompt: string,
  initialImage: string | null,
): Ltx23FastInput {
  const resolution = isLtxResolution(input.generation.resolution)
    ? input.generation.resolution
    : '1080p';
  const configuredAspectRatio = input.generation.aspectRatio;
  const aspectRatio = isLtxAspectRatio(configuredAspectRatio)
    ? configuredAspectRatio
    : initialImage
      ? 'auto'
      : '16:9';
  return {
    prompt,
    duration: input.generation.durationSeconds,
    fps: input.generation.frameRate,
    generate_audio: input.generation.enableAudio,
    resolution,
    aspect_ratio: !initialImage && aspectRatio === 'auto' ? '16:9' : aspectRatio,
    ...(initialImage ? { image_url: initialImage } : {}),
  };
}

function isLtxResolution(value: GenerationInput['generation']['resolution']) {
  return value === '1080p' || value === '1440p' || value === '2160p';
}

function isLtxAspectRatio(
  value: GenerationInput['generation']['aspectRatio'],
): value is Ltx23FastInput['aspect_ratio'] {
  return value === 'auto' || value === '16:9' || value === '9:16';
}
