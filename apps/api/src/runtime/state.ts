import type { WorldSnapshot } from '@infinite-world/api-contract';

import { normalizeStoredWorld } from '../domain/generation.js';
import { newRun, normalizeStoredRun } from '../domain/run.js';
import { loadState, saveState, defaultProviderState } from '../storage/file-store.js';
import type { PersistedState, ProviderState, StoredRun } from '../types.js';

export class RuntimeState {
  private readonly worlds = new Map<string, WorldSnapshot>();
  private readonly runs = new Map<string, StoredRun>();
  private state: PersistedState;
  readonly provider: ProviderState;

  constructor(persisted = loadState()) {
    this.state = persisted;
    for (const world of persisted.worlds) this.worlds.set(world.id, normalizeStoredWorld(world));
    for (const run of persisted.runs) this.runs.set(run.worldId, normalizeStoredRun(run));
    this.provider = { ...defaultProviderState(), ...persisted.provider };
    this.state.provider = this.provider;
    if (this.state.activeWorldId && !this.worlds.has(this.state.activeWorldId)) {
      this.state.activeWorldId = persisted.worlds[0]?.id ?? null;
    }
    for (const world of this.worlds.values()) {
      if (!this.runs.has(world.id)) this.runs.set(world.id, newRun(world.id));
    }
  }

  get activeWorldId() {
    return this.state.activeWorldId;
  }

  get activeWorld() {
    return this.state.activeWorldId ? this.worlds.get(this.state.activeWorldId) ?? null : null;
  }

  get activeRun() {
    return this.activeWorld ? this.runs.get(this.activeWorld.id) ?? null : null;
  }

  listWorldSnapshots() {
    return [...this.worlds.values()];
  }

  getWorld(worldId: string) {
    return this.worlds.get(worldId) ?? null;
  }

  getRun(worldId: string) {
    return this.runs.get(worldId) ?? null;
  }

  setWorld(worldId: string, world: WorldSnapshot) {
    this.worlds.set(worldId, world);
  }

  setRun(worldId: string, run: StoredRun) {
    this.runs.set(worldId, run);
  }

  setActiveWorldId(worldId: string) {
    this.state.activeWorldId = worldId;
  }

  persist() {
    this.state.worlds = [...this.worlds.values()];
    this.state.runs = [...this.runs.values()];
    this.state.provider = this.provider;
    saveState(this.state);
  }
}
