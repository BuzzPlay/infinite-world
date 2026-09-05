import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { DEFAULT_GENERATION } from '@infinite-world/api-contract';

import { appendScene, newRun } from '../src/domain/run.js';
import { imageForScene } from '../src/providers/ai/scene-input.js';
import type { GeneratedScene, GenerationInput } from '../src/types.js';

describe('scene continuity input', () => {
  test('uses the project image only for the first scene', () => {
    const run = newRun('world-1', 'run-1');
    const input = generationInput(run, { initialImageUrl: 'https://example.com/start.jpg' });

    assert.equal(imageForScene(input), 'https://example.com/start.jpg');

    appendScene(run, generatedScene('First scene'), DEFAULT_GENERATION, null);
    assert.equal(imageForScene(input), null);
  });

  test('uses the current scene continuity frame for the next scene', () => {
    const run = newRun('world-1', 'run-1');
    const scene = appendScene(
      run,
      {
        ...generatedScene('First scene'),
        continuityImageUrl: 'https://fal.media/first-last-frame.jpg',
      },
      DEFAULT_GENERATION,
      null,
    );
    const input = generationInput(run, { initialImageUrl: 'https://example.com/start.jpg' });

    assert.equal(input.run.currentScene?.id, scene.id);
    assert.equal(imageForScene(input), 'https://fal.media/first-last-frame.jpg');
  });
});

function generationInput(
  run: ReturnType<typeof newRun>,
  overrides: Partial<GenerationInput['generation']> = {},
): GenerationInput {
  const generation = { ...structuredClone(DEFAULT_GENERATION), ...overrides };
  return {
    world: {
      id: run.worldId,
      interactionType: 'text',
      name: 'Continuity world',
      prompt: 'A persistent world',
      generation,
      createdAt: new Date(0).toISOString(),
    },
    run,
    generation,
    parentSceneId: run.currentScene?.id ?? null,
    sourceOptionId: null,
    branchDirection: null,
  };
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
