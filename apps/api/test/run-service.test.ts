import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { DEFAULT_GENERATION } from '@infinite-world/api-contract';
import {
  FAL_GEMINI_FLASH_LITE_MODEL,
  FAL_GEMINI_MODEL,
  LTX_23_FAST_VIDEO_MODEL,
  MINIMAX_H3_VIDEO_MODEL,
} from '@infinite-world/api-contract/model-catalog';

import { applyGenerationInput } from '../src/domain/generation.js';
import {
  appendScene,
  generationForRunVersion,
  newRun,
  preserveSceneVersions,
} from '../src/domain/run.js';
import { RuntimeState } from '../src/runtime/state.js';
import { RunService } from '../src/services/run-service.js';
import type { GeneratedScene, RuntimeSnapshot } from '../src/types.js';

describe('run choices', () => {
  test('continues a stopped scene inside its existing version', () => {
    const worldId = 'world-with-choice';
    const firstRun = newRun(worldId, 'run-1', 1, RUN_GENERATION);
    const source = appendScene(firstRun, generatedScene('First scene'), RUN_GENERATION, null);
    const option = source.options[0];
    assert.ok(option);
    firstRun.state = 'stopped';

    const state = new RuntimeState(snapshot(worldId, firstRun), () => undefined);
    const service = new RunService(state);
    const nextRun = service.choose(worldId, option.id, source.id);

    assert.equal(nextRun.id, firstRun.id);
    assert.equal(nextRun.version, 1);
    assert.equal(nextRun.state, 'preparing');
    assert.equal(nextRun.currentScene?.id, source.id);
    assert.equal(nextRun.scenes.length, 1);
    assert.deepEqual(nextRun.pendingBranch, {
      sceneId: source.id,
      optionId: option.id,
      direction: option.title,
    });
    assert.deepEqual(nextRun.generationTask, {
      sourceSceneId: source.id,
      optionId: option.id,
      startedAt: nextRun.startedAt,
    });
    assert.equal(nextRun.scenes[0]?.options[0]?.votes, 1);
  });

  test('resumes the selected historical version without creating another version', () => {
    const worldId = 'world-with-historical-choice';
    const firstRun = newRun(worldId, 'run-1', 1, RUN_GENERATION);
    const source = appendScene(firstRun, generatedScene('First scene'), RUN_GENERATION, null);
    const option = source.options[0];
    assert.ok(option);
    firstRun.state = 'stopped';

    const latestRun = preserveSceneVersions(firstRun, newRun(worldId, 'run-2', 2, RUN_GENERATION));
    appendScene(latestRun, generatedScene('Second version'), RUN_GENERATION, null);
    latestRun.state = 'stopped';

    const state = new RuntimeState(snapshot(worldId, latestRun), () => undefined);
    const service = new RunService(state);
    const nextRun = service.choose(worldId, option.id, source.id);

    assert.equal(nextRun.id, firstRun.id);
    assert.equal(nextRun.version, 1);
    assert.equal(nextRun.scenes.length, 2);
    assert.equal(nextRun.pendingBranch?.sceneId, source.id);
    assert.deepEqual([...new Set(nextRun.scenes.map((scene) => scene.version))], [1, 2]);

    service.markRunning(worldId);
    const context = service.beginGeneration(worldId);
    const appended = service.append(
      worldId,
      generatedScene('Branched continuation'),
      RUN_GENERATION,
      context.parentSceneId
        ? { sceneId: context.parentSceneId, optionId: context.sourceOptionId }
        : null,
    );

    assert.equal(appended.scene.versionId, firstRun.id);
    assert.equal(appended.scene.version, 1);
    assert.equal(appended.scene.versionSceneSequence, 2);
    assert.equal(appended.scene.parentSceneId, source.id);
    assert.equal(appended.scene.sourceOptionId, option.id);
    assert.equal(appended.run.generationTask, null);
  });

  test('restores the selected version models before continuing its story branch', () => {
    const worldId = 'world-with-version-models';
    const ltxGeneration = structuredClone(RUN_GENERATION);
    const h3Generation = applyGenerationInput(
      { ...RUN_GENERATION, visionModel: FAL_GEMINI_FLASH_LITE_MODEL },
      { model: MINIMAX_H3_VIDEO_MODEL },
    );
    const firstRun = newRun(worldId, 'run-1', 1, ltxGeneration);
    const source = appendScene(firstRun, generatedScene('LTX scene'), ltxGeneration, null);
    const option = source.options[0];
    assert.ok(option);
    firstRun.state = 'stopped';

    const latestRun = preserveSceneVersions(firstRun, newRun(worldId, 'run-2', 2, h3Generation));
    appendScene(latestRun, generatedScene('H3 scene'), h3Generation, null);
    latestRun.state = 'stopped';

    const state = new RuntimeState(snapshot(worldId, latestRun, h3Generation), () => undefined);
    const nextRun = new RunService(state).choose(worldId, option.id, source.id);

    assert.equal(nextRun.id, firstRun.id);
    assert.equal(generationForRunVersion(nextRun, nextRun.id).model, LTX_23_FAST_VIDEO_MODEL);
    assert.equal(generationForRunVersion(nextRun, nextRun.id).visionModel, FAL_GEMINI_MODEL);
    assert.equal(state.getWorld(worldId)?.generation.model, LTX_23_FAST_VIDEO_MODEL);
    assert.equal(state.getWorld(worldId)?.generation.visionModel, FAL_GEMINI_MODEL);
    assert.equal(generationForRunVersion(nextRun, latestRun.id).model, MINIMAX_H3_VIDEO_MODEL);
  });

  test('queues a choice on the active version while it is running', () => {
    const worldId = 'running-world';
    const run = newRun(worldId, 'run-1', 1, RUN_GENERATION);
    const source = appendScene(run, generatedScene('Running scene'), RUN_GENERATION, null);
    const option = source.options[1];
    assert.ok(option);
    run.state = 'running';

    const state = new RuntimeState(snapshot(worldId, run), () => undefined);
    const nextRun = new RunService(state).choose(worldId, option.id, source.id);

    assert.equal(nextRun.id, run.id);
    assert.equal(nextRun.version, 1);
    assert.equal(nextRun.state, 'running');
    assert.equal(nextRun.pendingBranch?.sceneId, source.id);
    assert.equal(nextRun.generationTask?.sourceSceneId, source.id);
    assert.equal(nextRun.generationTask?.optionId, option.id);
    assert.equal(nextRun.scenes[0]?.options[1]?.votes, 1);

    assert.throws(
      () => new RunService(state).choose(worldId, source.options[0]?.id ?? '', source.id),
      /a scene is already being generated/,
    );
  });

  test('activates a saved scene without starting generation', () => {
    const worldId = 'world-with-saved-scene';
    const firstGeneration = structuredClone(RUN_GENERATION);
    const secondGeneration = applyGenerationInput(RUN_GENERATION, {
      model: MINIMAX_H3_VIDEO_MODEL,
    });
    const firstRun = newRun(worldId, 'run-1', 1, firstGeneration);
    const savedScene = appendScene(firstRun, generatedScene('Saved scene'), firstGeneration, null);
    firstRun.state = 'stopped';

    const currentRun = preserveSceneVersions(
      firstRun,
      newRun(worldId, 'run-2', 2, secondGeneration),
    );
    appendScene(currentRun, generatedScene('Latest scene'), secondGeneration, null);
    currentRun.state = 'stopped';

    const savedState = snapshot(worldId, currentRun, secondGeneration);
    savedState.provider = {};
    const state = new RuntimeState(savedState, () => undefined);
    const nextRun = new RunService(state).activateScene(worldId, savedScene.id);

    assert.equal(nextRun.id, firstRun.id);
    assert.equal(nextRun.version, 1);
    assert.equal(nextRun.state, 'preparing');
    assert.equal(nextRun.currentScene?.id, savedScene.id);
    assert.equal(nextRun.generationTask, null);
    assert.equal(nextRun.pendingBranch, null);
    assert.equal(state.getWorld(worldId)?.generation.model, firstGeneration.model);
    new RunService(state).markRunning(worldId);
    assert.throws(
      () => new RunService(state).choose(worldId, savedScene.options[0]?.id ?? '', savedScene.id),
      /configure a provider key/,
    );
  });

  test('deletes a non-current branch while the run remains active', () => {
    const worldId = 'running-world-delete-sibling';
    const run = newRun(worldId, 'run-1', 1, RUN_GENERATION);
    const root = appendScene(run, generatedScene('Root scene'), RUN_GENERATION, null);
    const firstOption = root.options[0];
    const secondOption = root.options[1];
    assert.ok(firstOption);
    assert.ok(secondOption);
    const currentBranch = appendScene(run, generatedScene('Current branch'), RUN_GENERATION, {
      sceneId: root.id,
      optionId: firstOption.id,
    });
    const siblingBranch = appendScene(run, generatedScene('Sibling branch'), RUN_GENERATION, {
      sceneId: root.id,
      optionId: secondOption.id,
    });
    run.currentScene = currentBranch;
    run.state = 'running';

    const state = new RuntimeState(snapshot(worldId, run), () => undefined);
    const nextRun = new RunService(state).deleteSceneBranch(worldId, siblingBranch.id).run;

    assert.equal(nextRun.state, 'running');
    assert.equal(nextRun.currentScene?.id, currentBranch.id);
    assert.equal(
      nextRun.scenes.some((scene) => scene.id === siblingBranch.id),
      false,
    );
    assert.equal(
      nextRun.scenes.some((scene) => scene.id === currentBranch.id),
      true,
    );
  });

  test('keeps running from the parent when the current branch is deleted', () => {
    const worldId = 'running-world-delete-current';
    const run = newRun(worldId, 'run-1', 1, RUN_GENERATION);
    const root = appendScene(run, generatedScene('Root scene'), RUN_GENERATION, null);
    const option = root.options[0];
    assert.ok(option);
    const branch = appendScene(run, generatedScene('Branch scene'), RUN_GENERATION, {
      sceneId: root.id,
      optionId: option.id,
    });
    const descendant = appendScene(run, generatedScene('Descendant scene'), RUN_GENERATION, {
      sceneId: branch.id,
      optionId: branch.options[0]?.id ?? null,
    });
    run.currentScene = descendant;
    run.state = 'running';

    const state = new RuntimeState(snapshot(worldId, run), () => undefined);
    const nextRun = new RunService(state).deleteSceneBranch(worldId, branch.id).run;

    assert.equal(nextRun.state, 'running');
    assert.equal(nextRun.currentScene?.id, root.id);
    assert.equal(nextRun.stoppedAt, null);
    assert.equal(
      nextRun.scenes.some((scene) => scene.id === branch.id),
      false,
    );
    assert.equal(
      nextRun.scenes.some((scene) => scene.id === descendant.id),
      false,
    );
  });

  test('rejects a choice from another version while a run is active', () => {
    const worldId = 'running-world-with-history';
    const previous = newRun(worldId, 'run-1', 1, RUN_GENERATION);
    const historicalScene = appendScene(
      previous,
      generatedScene('Historical scene'),
      RUN_GENERATION,
      null,
    );
    const option = historicalScene.options[0];
    assert.ok(option);
    const run = preserveSceneVersions(previous, newRun(worldId, 'run-2', 2, RUN_GENERATION));
    appendScene(run, generatedScene('Running scene'), RUN_GENERATION, null);
    run.state = 'running';

    const state = new RuntimeState(snapshot(worldId, run), () => undefined);
    const service = new RunService(state);

    assert.throws(
      () => service.choose(worldId, option.id, historicalScene.id),
      /stop the current run before continuing a different version/,
    );
    assert.equal(state.getRun(worldId)?.scenes[0]?.options[0]?.votes, 0);
  });

  test('uses the initial version for the first explicit run', () => {
    const worldId = 'new-world';
    const run = newRun(worldId, 'run-1', 1, RUN_GENERATION);
    const state = new RuntimeState(snapshot(worldId, run), () => undefined);

    const prepared = new RunService(state).prepare(worldId, {});

    assert.equal(prepared.run.id, 'run-1');
    assert.equal(prepared.run.version, 1);
    assert.equal(prepared.run.state, 'preparing');
  });

  test('replaces a scene choice set without changing the scene version', () => {
    const worldId = 'world-with-new-choices';
    const run = newRun(worldId, 'run-1', 1, RUN_GENERATION);
    const source = appendScene(run, generatedScene('A quiet clearing'), RUN_GENERATION, null);
    run.state = 'stopped';

    const state = new RuntimeState(snapshot(worldId, run), () => undefined);
    const service = new RunService(state);
    const context = service.sceneOptionContext(worldId, source.id);
    const previousOptionIds = context.scene.options.map((option) => option.id);
    const nextRun = service.replaceSceneOptions(worldId, source.id, [
      'Open the weathered gate',
      'Follow the footprints into the trees',
      'Signal toward the distant tower',
      'Wait beside the fire until dawn',
    ]);
    const updated = nextRun.scenes.find((scene) => scene.id === source.id);

    assert.deepEqual(
      updated?.options.map((option) => option.label),
      ['A', 'B', 'C', 'D'],
    );
    assert.deepEqual(
      updated?.options.map((option) => option.title),
      [
        'Open the weathered gate',
        'Follow the footprints into the trees',
        'Signal toward the distant tower',
        'Wait beside the fire until dawn',
      ],
    );
    assert.equal(
      updated?.options.some((option) => previousOptionIds.includes(option.id)),
      false,
    );
    assert.deepEqual(
      updated?.options.map((option) => option.votes),
      [0, 0, 0, 0],
    );
    assert.equal(updated?.versionId, source.versionId);
    assert.equal(context.lineage.at(-1)?.id, source.id);
  });
});

function snapshot(
  worldId: string,
  run: ReturnType<typeof newRun>,
  generation = RUN_GENERATION,
): RuntimeSnapshot {
  return {
    worlds: [
      {
        id: worldId,
        interactionType: 'text',
        name: 'Choice world',
        prompt: 'A world shaped by choices',
        generation: structuredClone(generation),
        createdAt: new Date(0).toISOString(),
      },
    ],
    activeWorldId: worldId,
    runs: [run],
    provider: { falApiKey: 'test-key' },
  };
}

const RUN_GENERATION = {
  ...structuredClone(DEFAULT_GENERATION),
  model: LTX_23_FAST_VIDEO_MODEL,
  visionModel: FAL_GEMINI_MODEL,
};

function generatedScene(prompt: string): GeneratedScene {
  return {
    prompt,
    contextSummary: prompt,
    previewUrl: `https://example.com/${encodeURIComponent(prompt)}.mp4`,
    mediaType: 'video',
    generationLatencyMs: 100,
  };
}
