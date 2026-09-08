import type { WorldConfig } from '@infinite-world/api-contract';

export interface ProjectRecord {
  id: string;
  worldId: string;
  interactionType: WorldConfig['interactionType'];
  optionLanguage?: WorldConfig['optionLanguage'];
  name: string;
  prompt: string;
  generation: WorldConfig['generation'];
  createdAt: string;
  icon?: string;
}

export function projectFromWorld(
  world: {
    id: string;
    interactionType: WorldConfig['interactionType'];
    optionLanguage?: WorldConfig['optionLanguage'];
    name: string;
    prompt: string;
    generation: WorldConfig['generation'];
    createdAt: string;
  },
  existing?: ProjectRecord,
): ProjectRecord {
  return {
    id: existing?.id ?? world.id,
    worldId: world.id,
    interactionType: world.interactionType,
    optionLanguage: world.optionLanguage ?? 'en',
    name: world.name,
    prompt: world.prompt,
    generation: world.generation,
    createdAt: existing?.createdAt ?? world.createdAt,
    icon: existing?.icon,
  };
}
