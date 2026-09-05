import type {
  DeleteWorldResponse,
  WorldConfig,
  WorldListResponse,
  WorldResponse,
} from '@infinite-world/api-contract';

import { makeWorld } from '../domain/generation.js';
import { clone, newRun, safeWorldResponse } from '../domain/run.js';
import type { RuntimeState } from '../runtime/state.js';
import { ApiError } from '../shared/errors.js';

export class WorldService {
  constructor(private readonly state: RuntimeState) {}

  list(): WorldListResponse {
    return {
      worlds: this.state.listWorldSnapshots().map(clone),
      activeWorldId: this.state.activeWorldId,
      providerApiKeyConfigured: Boolean(this.state.provider.falApiKey),
    };
  }

  current(): WorldResponse | null {
    const world = this.state.activeWorld;
    const run = this.state.activeRun;
    return world && run
      ? safeWorldResponse(world, run, Boolean(this.state.provider.falApiKey))
      : null;
  }

  forId(worldId: string): WorldResponse | null {
    const world = this.state.getWorld(worldId);
    const run = world ? this.state.getRun(worldId) : null;
    return world && run
      ? safeWorldResponse(world, run, Boolean(this.state.provider.falApiKey))
      : null;
  }

  create(config: WorldConfig) {
    const world = makeWorld(config, this.state.provider);
    const run = newRun(world.id, undefined, 1, world.generation);
    this.state.setWorld(world.id, world);
    this.state.setRun(world.id, run);
    this.state.setActiveWorldId(world.id);
    this.state.persist();
    return safeWorldResponse(world, run, Boolean(this.state.provider.falApiKey));
  }

  update(worldId: string, config: WorldConfig) {
    const current = this.state.getWorld(worldId);
    if (!current) throw new ApiError(404, 'not_found', 'world does not exist');
    const run = this.state.getRun(worldId);
    if (run && isActiveState(run.state))
      throw new ApiError(
        409,
        'invalid_state',
        'stop the current run before editing project settings',
      );
    const world = makeWorld(config, this.state.provider, current.id, current.createdAt);
    this.state.setWorld(worldId, world);
    this.state.persist();
    return safeWorldResponse(
      world,
      run ?? newRun(worldId, undefined, 1, world.generation),
      Boolean(this.state.provider.falApiKey),
    );
  }

  select(worldId: string) {
    if (!this.state.getWorld(worldId)) throw new ApiError(404, 'not_found', 'world does not exist');
    this.state.setActiveWorldId(worldId);
    this.state.persist();
    return this.current() as WorldResponse;
  }

  remove(worldId: string): DeleteWorldResponse {
    if (!this.state.getWorld(worldId)) throw new ApiError(404, 'not_found', 'world does not exist');
    const run = this.state.getRun(worldId);
    if (run && isActiveState(run.state))
      throw new ApiError(409, 'invalid_state', 'stop the run before deleting the project');

    this.state.deleteWorld(worldId);
    this.state.persist();
    return {
      deletedWorldId: worldId,
      activeWorld: this.current(),
    };
  }
}

function isActiveState(state: string) {
  return state === 'preparing' || state === 'running' || state === 'stopping';
}
