import { rmSync } from 'node:fs';
import type { WorldSnapshot } from '@infinite-world/api-contract';

import { generationForRunVersion, normalizeStoredRun } from '../domain/run.js';
import type { PersistedProjectState, StoredRun, VersionIndexEntry } from '../types.js';
import { readJson, writeJson } from './json-file.js';
import {
  projectConfigPath,
  projectDirectory,
  projectStatePath,
  versionDirectory,
  versionStatePath,
} from './paths.js';

export interface LoadedProject {
  world: WorldSnapshot;
  run: StoredRun;
}

export function deleteProject(dataDir: string, projectId: string) {
  rmSync(projectDirectory(dataDir, projectId), { recursive: true, force: true });
}

export function loadProject(dataDir: string, projectId: string): LoadedProject | null {
  const directory = projectDirectory(dataDir, projectId);
  const world = readJson<WorldSnapshot>(projectConfigPath(directory));
  const projectState = readJson<PersistedProjectState>(projectStatePath(directory));
  if (!world || !projectState) return null;
  const storedVersionRuns = projectState.versions
    .map((version) => readJson<StoredRun>(versionStatePath(directory, version)))
    .filter((run): run is StoredRun => Boolean(run))
    .map((run) => normalizeStoredRun(run, world.generation));
  const normalized = normalizeVersionBranches(storedVersionRuns, projectState.activeVersionId);
  const versionRuns = normalized.runs;
  const activeRun =
    versionRuns.find((run) => run.id === normalized.activeVersionId) ?? versionRuns.at(-1);
  if (!activeRun) return null;

  return {
    world,
    run: {
      ...activeRun,
      scenes: versionRuns
        .flatMap((run) => run.scenes)
        .sort((left, right) => left.sequence - right.sequence),
      generationHistory: versionRuns
        .flatMap((run) => run.generationHistory)
        .sort((left, right) => left.generationId - right.generationId),
      versions: mergedRunVersions(versionRuns),
    },
  };
}

export function saveProject(dataDir: string, world: WorldSnapshot, run: StoredRun) {
  const directory = projectDirectory(dataDir, world.id);
  const previousState = readJson<PersistedProjectState>(projectStatePath(directory));
  const previousVersions = new Map(
    (previousState?.versions ?? []).map((version) => [version.id, version]),
  );
  const scenesByVersion = groupScenesByVersion(run);
  const versions = [...scenesByVersion.entries()]
    .map(([versionId, scenes]) => {
      const version =
        versionId === run.id
          ? run.version
          : (scenes[0]?.version ?? previousVersions.get(versionId)?.version ?? 1);
      const previous = previousVersions.get(versionId);
      const index = versionIndex(versionId, version, scenes, world, run, previous);
      const previousRun = previous
        ? readJson<StoredRun>(versionStatePath(directory, previous))
        : null;
      const versionRun =
        versionId === run.id
          ? currentVersionRun(run, scenes, previousRun)
          : historicalVersionRun(run, versionId, version, scenes, previousRun);
      writeJson(versionStatePath(directory, index), versionRun);
      return index;
    })
    .sort((left, right) => left.version - right.version);

  removeMissingVersions(directory, previousState?.versions ?? [], versions);
  writeJson(projectConfigPath(directory), world);
  writeJson(projectStatePath(directory), {
    activeVersionId: run.id,
    versions,
  } satisfies PersistedProjectState);
}

function groupScenesByVersion(run: StoredRun) {
  const scenesByVersion = new Map<string, StoredRun['scenes']>();
  for (const scene of run.scenes) {
    scenesByVersion.set(scene.versionId, [...(scenesByVersion.get(scene.versionId) ?? []), scene]);
  }
  if (!scenesByVersion.has(run.id)) scenesByVersion.set(run.id, []);
  return scenesByVersion;
}

function currentVersionRun(
  run: StoredRun,
  scenes: StoredRun['scenes'],
  previous: StoredRun | null,
): StoredRun {
  const currentScene =
    run.currentScene && run.currentScene.versionId === run.id
      ? structuredClone(run.currentScene)
      : null;
  return {
    ...structuredClone(run),
    scenes: structuredClone(scenes),
    generationHistory: versionGenerationHistory(scenes, previous, run),
    currentScene,
    continuityImageUrl: currentScene?.continuityImageUrl ?? null,
  };
}

function historicalVersionRun(
  current: StoredRun,
  id: string,
  version: number,
  scenes: StoredRun['scenes'],
  previous: StoredRun | null,
): StoredRun {
  const latestScene = scenes.at(-1) ?? null;
  if (previous) {
    const currentScene = latestScene ? structuredClone(latestScene) : null;
    return {
      ...previous,
      scenes: structuredClone(scenes),
      sceneCount: scenes.length,
      currentScene,
      continuityImageUrl: currentScene?.continuityImageUrl ?? null,
      generationHistory: versionGenerationHistory(scenes, previous, current),
      versions: structuredClone(current.versions),
      generationTask: null,
    };
  }
  const currentScene = latestScene ? structuredClone(latestScene) : null;
  return {
    ...structuredClone(current),
    id,
    version,
    revision: 0,
    state: 'stopped',
    sceneCount: scenes.length,
    currentScene,
    lastError: null,
    startedAt: scenes[0]?.generatedAt ?? null,
    stoppedAt: latestScene?.generatedAt ?? null,
    output: null,
    scenes: structuredClone(scenes),
    generationHistory: versionGenerationHistory(scenes, current),
    versions: structuredClone(current.versions),
    outputSettings: null,
    pendingBranch: null,
    generationTask: null,
    continuityImageUrl: currentScene?.continuityImageUrl ?? null,
  };
}

function versionGenerationHistory(scenes: StoredRun['scenes'], ...runs: Array<StoredRun | null>) {
  const generationIds = new Set(scenes.map((scene) => scene.sequence));
  const records = new Map<number, StoredRun['generationHistory'][number]>();
  for (const run of runs) {
    for (const record of run?.generationHistory ?? []) {
      if (generationIds.has(record.generationId)) {
        records.set(record.generationId, structuredClone(record));
      }
    }
  }
  return [...records.values()].sort((left, right) => left.generationId - right.generationId);
}

function normalizeVersionBranches(versionRuns: StoredRun[], activeVersionId: string) {
  let runs = versionRuns.map((run) => structuredClone(run));
  let nextActiveVersionId = activeVersionId;

  while (true) {
    const scenes = runs.flatMap((run) => run.scenes);
    const scenesById = new Map(scenes.map((scene) => [scene.id, scene]));
    const source = [...runs]
      .sort((left, right) => left.version - right.version)
      .find((run) => {
        const firstScene = firstVersionScene(run);
        const parent = firstScene?.parentSceneId
          ? scenesById.get(firstScene.parentSceneId)
          : undefined;
        return Boolean(parent && parent.versionId !== run.id);
      });
    if (!source) break;

    const sourceRoot = firstVersionScene(source);
    const parent = sourceRoot?.parentSceneId ? scenesById.get(sourceRoot.parentSceneId) : undefined;
    const target = parent ? runs.find((run) => run.id === parent.versionId) : undefined;
    if (!sourceRoot || !target) break;

    const sourceWasActive = source.id === nextActiveVersionId;
    const base = sourceWasActive ? source : target;
    const nextVersionSceneSequence = target.scenes.reduce(
      (maximum, scene) => Math.max(maximum, scene.versionSceneSequence),
      0,
    );
    const movedScenes = [...source.scenes]
      .sort((left, right) => left.sequence - right.sequence)
      .map((scene, index) => ({
        ...scene,
        versionId: target.id,
        version: target.version,
        versionSceneSequence: nextVersionSceneSequence + index + 1,
      }));
    const mergedScenes = [...target.scenes, ...movedScenes].sort(
      (left, right) => left.sequence - right.sequence,
    );
    const currentSceneId = sourceWasActive ? source.currentScene?.id : target.currentScene?.id;
    const histories = new Map(
      [...target.generationHistory, ...source.generationHistory].map((record) => [
        record.generationId,
        record,
      ]),
    );
    const mergedRun: StoredRun = {
      ...base,
      id: target.id,
      version: target.version,
      scenes: mergedScenes,
      sceneCount: mergedScenes.length,
      currentScene: currentSceneId
        ? (mergedScenes.find((scene) => scene.id === currentSceneId) ?? null)
        : null,
      generationHistory: [...histories.values()].sort(
        (left, right) => left.generationId - right.generationId,
      ),
      versions: mergedRunVersions([target, source]).filter((version) => version.id !== source.id),
      metrics: { ...base.metrics, sceneCount: mergedScenes.length },
    };
    mergedRun.continuityImageUrl = mergedRun.currentScene?.continuityImageUrl ?? null;

    runs = [...runs.filter((run) => run.id !== source.id && run.id !== target.id), mergedRun].sort(
      (left, right) => left.version - right.version,
    );
    if (sourceWasActive) nextActiveVersionId = target.id;
  }

  return { runs, activeVersionId: nextActiveVersionId };
}

function mergedRunVersions(runs: StoredRun[]) {
  const versions = new Map<string, StoredRun['versions'][number]>();
  for (const run of runs) {
    for (const version of run.versions) versions.set(version.id, structuredClone(version));
    versions.set(run.id, {
      id: run.id,
      version: run.version,
      generation: generationForRunVersion(run, run.id),
      latestSceneId: run.currentScene?.versionId === run.id ? run.currentScene.id : null,
      lastActivityAt: run.currentScene?.versionId === run.id ? run.currentScene.generatedAt : null,
    });
  }
  return [...versions.values()].sort((left, right) => left.version - right.version);
}

function firstVersionScene(run: StoredRun) {
  return run.scenes.reduce<StoredRun['scenes'][number] | null>(
    (first, scene) =>
      !first ||
      scene.versionSceneSequence < first.versionSceneSequence ||
      (scene.versionSceneSequence === first.versionSceneSequence && scene.sequence < first.sequence)
        ? scene
        : first,
    null,
  );
}

function versionIndex(
  id: string,
  version: number,
  scenes: StoredRun['scenes'],
  world: WorldSnapshot,
  current: StoredRun,
  previous?: VersionIndexEntry,
): VersionIndexEntry {
  const createdAt =
    previous?.createdAt ??
    (id === current.id ? current.startedAt : null) ??
    scenes[0]?.generatedAt ??
    world.createdAt;
  return {
    id,
    version,
    createdAt,
    updatedAt: scenes.at(-1)?.generatedAt ?? current.stoppedAt ?? createdAt,
  };
}

function removeMissingVersions(
  projectDir: string,
  previous: VersionIndexEntry[],
  current: VersionIndexEntry[],
) {
  const currentIds = new Set(current.map((version) => version.id));
  for (const version of previous) {
    if (!currentIds.has(version.id)) {
      rmSync(versionDirectory(projectDir, version), { recursive: true, force: true });
    }
  }
}
