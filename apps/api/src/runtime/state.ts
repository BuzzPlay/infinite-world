import type { WorldSnapshot } from '@infinite-world/api-contract';

import { normalizeStoredWorld } from '../domain/generation.js';
import { newRun, normalizeStoredRun } from '../domain/run.js';
import { defaultProviderState, loadState, saveState } from '../storage/file-store.js';
import type { ProviderState, RuntimeSnapshot, StoredRun } from '../types.js';

export class RuntimeState {
  private readonly worlds = new Map<string, WorldSnapshot>();
  private readonly runs = new Map<string, StoredRun>();
  private state: RuntimeSnapshot;
  readonly provider: ProviderState;

  constructor(
    persisted = loadState(),
    private readonly persistState: (state: RuntimeSnapshot) => void = saveState,
  ) {
    this.state = persisted;
    for (const world of persisted.worlds) this.worlds.set(world.id, normalizeStoredWorld(world));
    for (const run of persisted.runs) {
      const world = this.worlds.get(run.worldId);
      this.runs.set(run.worldId, normalizeStoredRun(run, world?.generation));
    }
    const savedProvider = persisted.provider;
    const defaults = defaultProviderState();
    this.provider = {
      ...defaults,
      ...(savedProvider.falApiKey !== undefined ? { falApiKey: savedProvider.falApiKey } : {}),
      ...(savedProvider.googleApiKey !== undefined
        ? { googleApiKey: savedProvider.googleApiKey }
        : {}),
      ...(savedProvider.twitchStreamKey !== undefined
        ? { twitchStreamKey: savedProvider.twitchStreamKey }
        : {}),
      ...(savedProvider.twitchOauthToken !== undefined
        ? { twitchOauthToken: savedProvider.twitchOauthToken }
        : {}),
      ...(savedProvider.defaultStylePreset !== undefined
        ? { defaultStylePreset: savedProvider.defaultStylePreset }
        : {}),
      ...(savedProvider.twitchChannel !== undefined
        ? { twitchChannel: savedProvider.twitchChannel }
        : {}),
      ...(savedProvider.twitchUsername !== undefined
        ? { twitchUsername: savedProvider.twitchUsername }
        : {}),
      ...(savedProvider.chatLookback !== undefined
        ? { chatLookback: savedProvider.chatLookback }
        : {}),
    };
    this.state.provider = this.provider;
    if (this.state.activeWorldId && !this.worlds.has(this.state.activeWorldId)) {
      this.state.activeWorldId = persisted.worlds[0]?.id ?? null;
    }
    for (const world of this.worlds.values()) {
      if (!this.runs.has(world.id)) {
        this.runs.set(world.id, newRun(world.id, undefined, 1, world.generation));
      }
    }
  }

  get activeWorldId() {
    return this.state.activeWorldId;
  }

  get activeWorld() {
    return this.state.activeWorldId ? (this.worlds.get(this.state.activeWorldId) ?? null) : null;
  }

  get activeRun() {
    return this.activeWorld ? (this.runs.get(this.activeWorld.id) ?? null) : null;
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

  deleteWorld(worldId: string) {
    this.worlds.delete(worldId);
    this.runs.delete(worldId);
    if (this.state.activeWorldId === worldId) {
      this.state.activeWorldId = this.worlds.keys().next().value ?? null;
    }
  }

  setActiveWorldId(worldId: string | null) {
    this.state.activeWorldId = worldId;
  }

  persist() {
    this.state.worlds = [...this.worlds.values()];
    this.state.runs = [...this.runs.values()];
    this.state.provider = this.provider;
    this.persistState(this.state);
  }
}
