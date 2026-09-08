import type { StylePreset, WorldConfig } from '@infinite-world/api-contract';
import { DEFAULT_GENERATION } from '@infinite-world/api-contract';

export function stylePresetChanges(preset: StylePreset) {
  switch (preset) {
    case 'cohesive':
      return { mode: 'regular' as const, guidanceScale: 2, noiseScale: 0.03 };
    case 'chaotic':
      return { mode: 'regular' as const, guidanceScale: 3, noiseScale: 0.15 };
    case 'nightmare':
      return { mode: 'nightmare' as const, guidanceScale: 3.5, noiseScale: 0.2 };
    case 'custom':
      return {};
  }
}

export const defaultWorldConfig: WorldConfig = {
  interactionType: 'text',
  optionLanguage: 'en',
  name: '',
  prompt: '',
  generation: { ...DEFAULT_GENERATION },
};
