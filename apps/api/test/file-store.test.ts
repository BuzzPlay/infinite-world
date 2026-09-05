import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import { DEFAULT_GENERATION } from '@infinite-world/api-contract';
import {
  FAL_GEMINI_MODEL,
  LTX_23_FAST_VIDEO_MODEL,
  MINIMAX_H3_VIDEO_MODEL,
} from '@infinite-world/api-contract/model-catalog';

import { applyGenerationInput } from '../src/domain/generation.js';
import { appendScene, newRun, preserveSceneVersions, removeRunVersion } from '../src/domain/run.js';
import { loadState, saveState } from '../src/storage/file-store.js';
import type { GeneratedScene, RuntimeSnapshot } from '../src/types.js';

describe('project file store', () => {
  test('stores the project and each run version in separate directories', () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'infinite-world-store-'));
    const worldId = 'world-1';
    const firstGeneration = versionGeneration(LTX_23_FAST_VIDEO_MODEL);
    const secondGeneration = applyGenerationInput(firstGeneration, {
      model: MINIMAX_H3_VIDEO_MODEL,
    });
    const first = newRun(worldId, 'run-1', 1, firstGeneration);
    const firstScene = appendScene(first, generatedScene('First version'), firstGeneration, null);
    first.state = 'stopped';
    const current = preserveSceneVersions(first, newRun(worldId, 'run-2', 2, secondGeneration));
    const currentRoot = appendScene(
      current,
      generatedScene('Second version'),
      secondGeneration,
      null,
    );
    appendScene(current, generatedScene('Second scene'), secondGeneration, {
      sceneId: currentRoot.id,
      optionId: null,
    });
    const snapshot: RuntimeSnapshot = {
      worlds: [
        {
          id: worldId,
          interactionType: 'text',
          name: 'World one',
          prompt: 'A persistent world',
          generation: structuredClone(secondGeneration),
          createdAt: new Date(0).toISOString(),
        },
      ],
      activeWorldId: worldId,
      runs: [current],
      provider: { falApiKey: 'local-secret' },
    };

    try {
      saveState(snapshot, dataDir);

      const root = readJson(join(dataDir, 'state.json'));
      assert.deepEqual(Object.keys(root).sort(), [
        'activeProjectId',
        'projects',
        'provider',
        'schemaVersion',
      ]);
      assert.equal('worlds' in root, false);
      assert.equal('runs' in root, false);
      assert.equal((root.projects as Array<Record<string, unknown>>)[0]?.interactionType, 'text');

      const projectDir = join(dataDir, 'projects', worldId);
      assert.equal(existsSync(join(projectDir, 'project.json')), true);
      assert.equal(existsSync(join(projectDir, 'state.json')), true);
      assert.equal(existsSync(join(projectDir, 'versions', '0001', 'state.json')), true);
      assert.equal(existsSync(join(projectDir, 'versions', '0002', 'state.json')), true);

      const restored = loadState(dataDir);
      assert.equal(restored.worlds[0]?.id, worldId);
      assert.equal(restored.runs[0]?.id, 'run-2');
      assert.deepEqual(
        restored.runs[0]?.scenes.map((scene) => scene.id),
        [firstScene.id, currentRoot.id, `scene-${current.id}-3`],
      );
      assert.deepEqual(
        restored.runs[0]?.versions.map((version) => [version.id, version.generation.model]),
        [
          [first.id, LTX_23_FAST_VIDEO_MODEL],
          [current.id, MINIMAX_H3_VIDEO_MODEL],
        ],
      );

      removeRunVersion(current, firstScene.versionId);
      saveState(snapshot, dataDir);
      assert.equal(existsSync(join(projectDir, 'versions', '0001')), false);
    } finally {
      rmSync(dataDir, { recursive: true, force: true });
    }
  });

  test('removes the directory of a deleted project', () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'infinite-world-store-'));
    const firstWorldId = 'world-to-keep';
    const removedWorldId = 'world-to-remove';
    const firstRun = newRun(firstWorldId, 'run-to-keep');
    const removedRun = newRun(removedWorldId, 'run-to-remove');
    const firstWorld = {
      id: firstWorldId,
      interactionType: 'text' as const,
      name: 'Kept world',
      prompt: 'This world remains',
      generation: structuredClone(DEFAULT_GENERATION),
      createdAt: new Date(0).toISOString(),
    };
    const removedWorld = {
      ...firstWorld,
      id: removedWorldId,
      name: 'Removed world',
    };

    try {
      saveState(
        {
          worlds: [firstWorld, removedWorld],
          activeWorldId: removedWorldId,
          runs: [firstRun, removedRun],
          provider: {},
        },
        dataDir,
      );
      const removedDirectory = join(dataDir, 'projects', removedWorldId);
      assert.equal(existsSync(removedDirectory), true);

      saveState(
        {
          worlds: [firstWorld],
          activeWorldId: firstWorldId,
          runs: [firstRun],
          provider: {},
        },
        dataDir,
      );

      assert.equal(existsSync(removedDirectory), false);
      assert.equal(existsSync(join(dataDir, 'projects', firstWorldId)), true);
      const root = readJson(join(dataDir, 'state.json'));
      assert.deepEqual(
        (root.projects as Array<{ id: string }>).map((project) => project.id),
        [firstWorldId],
      );
    } finally {
      rmSync(dataDir, { recursive: true, force: true });
    }
  });

  test('folds a stored cross-version continuation back into its source version', () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'infinite-world-store-'));
    const worldId = 'world-with-legacy-branch';
    const first = newRun(worldId, 'run-1', 1);
    const root = appendScene(first, generatedScene('First scene'), DEFAULT_GENERATION, null);
    first.state = 'stopped';
    const second = preserveSceneVersions(first, newRun(worldId, 'run-2', 2));
    appendScene(second, generatedScene('Branched scene'), DEFAULT_GENERATION, {
      sceneId: root.id,
      optionId: root.options[0]?.id ?? null,
    });
    second.state = 'stopped';
    const snapshot: RuntimeSnapshot = {
      worlds: [
        {
          id: worldId,
          interactionType: 'text',
          name: 'Branched world',
          prompt: 'A world with a stored branch',
          generation: structuredClone(DEFAULT_GENERATION),
          createdAt: new Date(0).toISOString(),
        },
      ],
      activeWorldId: worldId,
      runs: [second],
      provider: {},
    };

    try {
      saveState(snapshot, dataDir);

      const restored = loadState(dataDir);
      const restoredRun = restored.runs[0];
      assert.equal(restoredRun?.id, first.id);
      assert.equal(restoredRun?.version, 1);
      assert.equal(restoredRun?.sceneCount, 2);
      assert.deepEqual(
        restoredRun?.scenes.map((scene) => ({
          id: scene.id,
          versionId: scene.versionId,
          version: scene.version,
          versionSceneSequence: scene.versionSceneSequence,
        })),
        [
          { id: root.id, versionId: first.id, version: 1, versionSceneSequence: 1 },
          {
            id: `scene-${second.id}-2`,
            versionId: first.id,
            version: 1,
            versionSceneSequence: 2,
          },
        ],
      );
      assert.equal(restoredRun?.generationHistory.length, 2);

      saveState(restored, dataDir);
      const projectDir = join(dataDir, 'projects', worldId);
      assert.equal(existsSync(join(projectDir, 'versions', '0001', 'state.json')), true);
      assert.equal(existsSync(join(projectDir, 'versions', '0002')), false);
    } finally {
      rmSync(dataDir, { recursive: true, force: true });
    }
  });
});

function readJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}

function generatedScene(prompt: string): GeneratedScene {
  return {
    prompt,
    contextSummary: prompt,
    previewUrl: `https://example.com/${encodeURIComponent(prompt)}.mp4`,
    mediaType: 'video',
    generationLatencyMs: 100,
  };
}

function versionGeneration(model: string) {
  return applyGenerationInput(
    {
      ...structuredClone(DEFAULT_GENERATION),
      model: LTX_23_FAST_VIDEO_MODEL,
      visionModel: FAL_GEMINI_MODEL,
    },
    { model },
  );
}
