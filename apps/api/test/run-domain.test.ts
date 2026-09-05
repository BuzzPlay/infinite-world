import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { DEFAULT_GENERATION } from '@infinite-world/api-contract';
import {
  FAL_GEMINI_MODEL,
  LTX_23_FAST_VIDEO_MODEL,
  MINIMAX_H3_VIDEO_MODEL,
} from '@infinite-world/api-contract/model-catalog';

import {
  appendScene,
  newRun,
  normalizeStoredRun,
  preserveSceneVersions,
  removeRunVersion,
  removeSceneBranch,
  runForSceneBranch,
} from '../src/domain/run.js';
import type { GeneratedScene } from '../src/types.js';

describe('scene versions', () => {
  test('keeps versions between runs and removes complete descendant branches', () => {
    const previous = newRun('world-1', 'run-1');
    const root = appendScene(previous, generatedScene('Root'), DEFAULT_GENERATION, null);
    const child = appendScene(previous, generatedScene('Child'), DEFAULT_GENERATION, {
      sceneId: root.id,
      optionId: root.options[0]?.id ?? null,
    });
    const grandchild = appendScene(previous, generatedScene('Grandchild'), DEFAULT_GENERATION, {
      sceneId: child.id,
      optionId: child.options[0]?.id ?? null,
    });
    const sibling = appendScene(previous, generatedScene('Sibling'), DEFAULT_GENERATION, {
      sceneId: root.id,
      optionId: root.options[1]?.id ?? null,
    });

    const current = preserveSceneVersions(previous, newRun('world-1', 'run-2', 2));
    assert.equal(current.scenes.length, 4);
    assert.equal(current.sceneCount, 0);
    assert.equal(current.currentScene, null);

    const newRoot = appendScene(current, generatedScene('New root'), DEFAULT_GENERATION, null);
    assert.equal(newRoot.sequence, 5);
    assert.equal(newRoot.version, 2);
    assert.equal(newRoot.versionSceneSequence, 1);
    assert.equal(newRoot.parentSceneId, null);
    assert.equal(current.sceneCount, 1);
    assert.equal(
      normalizeStoredRun(structuredClone(current)).scenes.find((scene) => scene.id === newRoot.id)
        ?.parentSceneId,
      null,
    );

    assert.deepEqual(
      new Set(removeSceneBranch(current, child.id)),
      new Set([child.id, grandchild.id]),
    );
    assert.deepEqual(
      current.scenes.map((scene) => scene.id),
      [root.id, sibling.id, newRoot.id],
    );
    assert.equal(current.sceneCount, 1);

    const continuation = appendScene(current, generatedScene('Continuation'), DEFAULT_GENERATION, {
      sceneId: newRoot.id,
      optionId: newRoot.options[0]?.id ?? null,
    });
    assert.equal(continuation.sequence, 6);
    assert.equal(continuation.versionSceneSequence, 2);
  });

  test('returns the current scene to the surviving parent when its branch is deleted', () => {
    const run = newRun('world-1', 'run-1');
    const root = appendScene(run, generatedScene('Root'), DEFAULT_GENERATION, null);
    const branch = appendScene(run, generatedScene('Branch'), DEFAULT_GENERATION, {
      sceneId: root.id,
      optionId: root.options[0]?.id ?? null,
    });
    const descendant = appendScene(run, generatedScene('Descendant'), DEFAULT_GENERATION, {
      sceneId: branch.id,
      optionId: branch.options[0]?.id ?? null,
    });
    const sibling = appendScene(run, generatedScene('Sibling'), DEFAULT_GENERATION, {
      sceneId: root.id,
      optionId: root.options[1]?.id ?? null,
    });
    run.currentScene = descendant;

    assert.equal(run.currentScene?.id, descendant.id);
    assert.deepEqual(
      new Set(removeSceneBranch(run, branch.id)),
      new Set([branch.id, descendant.id]),
    );
    assert.equal(run.currentScene?.id, root.id);
    assert.equal(run.metrics.currentPrompt, root.prompt);
    assert.equal(
      run.scenes.some((scene) => scene.id === sibling.id),
      true,
    );
  });

  test('removes one run version without deleting scenes continued in another version', () => {
    const previous = newRun('world-1', 'run-1', 1);
    const root = appendScene(previous, generatedScene('Root'), DEFAULT_GENERATION, null);
    const current = preserveSceneVersions(previous, newRun('world-1', 'run-2', 2));
    const continuation = appendScene(current, generatedScene('Continuation'), DEFAULT_GENERATION, {
      sceneId: root.id,
      optionId: root.options[0]?.id ?? null,
    });

    assert.deepEqual(removeRunVersion(current, previous.id), [root.id]);
    assert.deepEqual(
      current.scenes.map((scene) => scene.id),
      [continuation.id],
    );
    assert.equal(current.scenes[0]?.parentSceneId, null);
    assert.equal(current.scenes[0]?.sourceOptionId, null);
    assert.equal(current.currentScene?.id, continuation.id);
    assert.equal(current.sceneCount, 1);
  });

  test('promotes the latest remaining version after deleting the active version', () => {
    const first = newRun('world-1', 'run-1', 1);
    const firstRoot = appendScene(first, generatedScene('First version'), DEFAULT_GENERATION, null);
    const second = preserveSceneVersions(first, newRun('world-1', 'run-2', 2));
    const secondRoot = appendScene(
      second,
      generatedScene('Second version'),
      DEFAULT_GENERATION,
      null,
    );
    const resumedFirst = runForSceneBranch(second, firstRoot);
    resumedFirst.state = 'stopped';

    assert.deepEqual(removeRunVersion(resumedFirst, first.id), [firstRoot.id]);
    assert.equal(resumedFirst.id, second.id);
    assert.equal(resumedFirst.version, 2);
    assert.equal(resumedFirst.currentScene?.id, secondRoot.id);
    assert.equal(resumedFirst.sceneCount, 1);
    assert.equal(resumedFirst.metrics.sceneCount, 1);
  });

  test('reconstructs version settings from generation history for stored runs without snapshots', () => {
    const ltxGeneration = {
      ...structuredClone(DEFAULT_GENERATION),
      model: LTX_23_FAST_VIDEO_MODEL,
      visionModel: FAL_GEMINI_MODEL,
    };
    const fallbackGeneration = {
      ...ltxGeneration,
      model: MINIMAX_H3_VIDEO_MODEL,
    };
    const run = newRun('world-1', 'run-1', 1, ltxGeneration);
    appendScene(run, generatedScene('Stored scene'), ltxGeneration, null);
    const { versions: _versions, ...stored } = structuredClone(run);

    const restored = normalizeStoredRun(stored as typeof run, fallbackGeneration);

    assert.equal(restored.versions[0]?.generation.model, LTX_23_FAST_VIDEO_MODEL);
    assert.equal(restored.versions[0]?.generation.visionModel, FAL_GEMINI_MODEL);
  });
});

function generatedScene(prompt: string): GeneratedScene {
  return {
    prompt,
    contextSummary: prompt,
    previewUrl: `https://example.com/${encodeURIComponent(prompt)}.mp4`,
    mediaType: 'video',
    options: testOptions(),
    generationLatencyMs: 100,
  };
}

function testOptions() {
  return ['A', 'B', 'C', 'D'].map((label) => ({
    id: `test-option-${label}`,
    label,
    title: `Option ${label}`,
    votes: 0,
  }));
}
