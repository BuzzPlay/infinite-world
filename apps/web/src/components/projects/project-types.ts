import type { WorldConfig } from '@infinite-world/api-contract';

export interface ProjectRecord {
  id: string;
  worldId: string;
  name: string;
  prompt: string;
  generation: WorldConfig['generation'];
  providerApiKeyConfigured: boolean;
  createdAt: string;
}

export function projectFromWorld(
  world: {
    id: string;
    name: string;
    prompt: string;
    generation: WorldConfig['generation'];
    createdAt: string;
  },
  providerApiKeyConfigured: boolean,
  existing?: ProjectRecord,
): ProjectRecord {
  return {
    id: existing?.id ?? world.id,
    worldId: world.id,
    name: world.name,
    prompt: world.prompt,
    generation: world.generation,
    providerApiKeyConfigured,
    createdAt: existing?.createdAt ?? world.createdAt,
  };
}
