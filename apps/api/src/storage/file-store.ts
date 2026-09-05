import { mkdirSync } from 'node:fs';

import { config } from '../config.js';
import type { PersistedRootState, ProviderState, RuntimeSnapshot } from '../types.js';
import { readJson, writeJson } from './json-file.js';
import { rootStatePath } from './paths.js';
import { deleteProject, loadProject, saveProject } from './project-store.js';

const EMPTY_STATE: RuntimeSnapshot = {
  worlds: [],
  activeWorldId: null,
  runs: [],
  provider: {},
};

export function loadState(dataDir = config.dataDir): RuntimeSnapshot {
  const root = readJson<PersistedRootState>(rootStatePath(dataDir));
  if (root?.schemaVersion !== 1) return structuredClone(EMPTY_STATE);

  const projects = root.projects.flatMap((project) => {
    const loaded = loadProject(dataDir, project.id);
    return loaded ? [loaded] : [];
  });
  const activeWorldId = projects.some((project) => project.world.id === root.activeProjectId)
    ? root.activeProjectId
    : (projects[0]?.world.id ?? null);
  return {
    worlds: projects.map((project) => project.world),
    runs: projects.map((project) => project.run),
    activeWorldId,
    provider: root.provider ?? {},
  };
}

export function saveState(state: RuntimeSnapshot, dataDir = config.dataDir) {
  mkdirSync(dataDir, { recursive: true });
  const previous = readJson<PersistedRootState>(rootStatePath(dataDir));
  const projects = state.worlds.flatMap((world) => {
    const run = state.runs.find((candidate) => candidate.worldId === world.id);
    if (!run) return [];
    saveProject(dataDir, world, run);
    return [
      {
        id: world.id,
        name: world.name,
        interactionType: world.interactionType,
        createdAt: world.createdAt,
      },
    ];
  });
  const root: PersistedRootState = {
    schemaVersion: 1,
    activeProjectId: state.activeWorldId,
    projects,
    provider: state.provider,
  };
  writeJson(rootStatePath(dataDir), root);
  const projectIds = new Set(projects.map((project) => project.id));
  for (const project of previous?.projects ?? []) {
    if (!projectIds.has(project.id)) deleteProject(dataDir, project.id);
  }
}

export function defaultProviderState(): ProviderState {
  return {
    falApiKey: null,
    googleApiKey: null,
    twitchStreamKey: null,
    twitchOauthToken: null,
    defaultStylePreset: 'cohesive',
    twitchChannel: '',
    twitchUsername: '',
    chatLookback: 5,
  };
}
