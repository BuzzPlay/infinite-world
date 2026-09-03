import type { WorldConfig, WorldListResponse, WorldResponse } from '@infinite-world/api-contract';

import { makeWorld } from '../domain/generation.js';
import { clone, newRun, safeWorldResponse } from '../domain/run.js';
import { ApiError } from '../shared/errors.js';
import type { RuntimeState } from '../runtime/state.js';

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
    const run = newRun(world.id);
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
    return safeWorldResponse(world, run ?? newRun(worldId), Boolean(this.state.provider.falApiKey));
  }

  select(worldId: string) {
    if (!this.state.getWorld(worldId)) throw new ApiError(404, 'not_found', 'world does not exist');
    if (this.state.activeRun && isActiveState(this.state.activeRun.state)) {
      throw new ApiError(409, 'invalid_state', 'stop the current run before switching projects');
    }
    this.state.setActiveWorldId(worldId);
    this.state.persist();
    return this.current() as WorldResponse;
  }
}

function isActiveState(state: string) {
  return state === 'preparing' || state === 'running' || state === 'stopping';
}
