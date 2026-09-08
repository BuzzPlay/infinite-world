import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { DEFAULT_GENERATION } from '@infinite-world/api-contract';
import {
  LTX_23_FAST_IMAGE_ENDPOINT,
  LTX_23_FAST_VIDEO_MODEL,
  MINIMAX_H3_IMAGE_ENDPOINT,
  MINIMAX_H3_TEXT_ENDPOINT,
  MINIMAX_H3_VIDEO_MODEL,
  MODEL_CATALOG,
  SEEDANCE_25_IMAGE_ENDPOINT,
  SEEDANCE_25_TEXT_ENDPOINT,
  SEEDANCE_25_VIDEO_MODEL,
  videoEndpointFor,
} from '@infinite-world/api-contract/model-catalog';

import { applyGenerationInput } from '../src/domain/generation.js';
import { newRun } from '../src/domain/run.js';
import { ltx23FastInput } from '../src/providers/ai/video-models/ltx-2.3-fast.js';
import { minimaxH3Input } from '../src/providers/ai/video-models/minimax-h3.js';
import { seedance25Input } from '../src/providers/ai/video-models/seedance-2.5.js';
import type { GenerationInput } from '../src/types.js';

describe('video model adapters', () => {
  test('keeps only video models that can continue from an image', () => {
    for (const model of MODEL_CATALOG.video) {
      if (model.id === 'none') continue;
      assert.ok(model.video?.endpoints['image-to-video']);
    }
  });

  test('maps MiniMax H3 text and image endpoints', () => {
    assert.equal(
      videoEndpointFor(MINIMAX_H3_VIDEO_MODEL, 'text-to-video'),
      MINIMAX_H3_TEXT_ENDPOINT,
    );
    assert.equal(
      videoEndpointFor(MINIMAX_H3_VIDEO_MODEL, 'image-to-video'),
      MINIMAX_H3_IMAGE_ENDPOINT,
    );
  });

  test('maps Seedance 2.5 text and image endpoints', () => {
    assert.equal(
      videoEndpointFor(SEEDANCE_25_VIDEO_MODEL, 'text-to-video'),
      SEEDANCE_25_TEXT_ENDPOINT,
    );
    assert.equal(
      videoEndpointFor(SEEDANCE_25_VIDEO_MODEL, 'image-to-video'),
      SEEDANCE_25_IMAGE_ENDPOINT,
    );
  });

  test('builds Seedance 2.5 requests with the optional continuity frame', () => {
    const input = generationInput({
      model: SEEDANCE_25_VIDEO_MODEL,
      durationSeconds: 5,
      resolution: '720p',
      aspectRatio: 'auto',
      seed: 42,
    });

    assert.deepEqual(seedance25Input(input, 'A lantern flickers', null), {
      prompt: 'A lantern flickers',
      duration: '5',
    });
    assert.deepEqual(seedance25Input(input, 'A lantern flickers', 'https://example.com/a.jpg'), {
      prompt: 'A lantern flickers',
      duration: '5',
      image_url: 'https://example.com/a.jpg',
    });
  });

  test('builds a MiniMax H3 text-to-video request without LTX-only fields', () => {
    const input = generationInput({
      model: MINIMAX_H3_VIDEO_MODEL,
      durationSeconds: 10,
      resolution: '768P',
      aspectRatio: '4:3',
      seed: 42,
      frameRate: 24,
      enableAudio: false,
    });

    assert.deepEqual(minimaxH3Input(input, 'A forest path', null), {
      prompt: 'A forest path',
      duration: 10,
      resolution: '768P',
      prompt_expansion_mode: null,
      seed: 42,
      aspect_ratio: '4:3',
    });
  });

  test('builds a MiniMax H3 image-to-video request using the supplied opening frame', () => {
    const input = generationInput({
      model: MINIMAX_H3_VIDEO_MODEL,
      durationSeconds: 5,
      resolution: '2K',
      aspectRatio: 'auto',
      seed: null,
      frameRate: 24,
      enableAudio: false,
    });

    assert.deepEqual(
      minimaxH3Input(input, 'The character turns around', 'https://example.com/a.jpg'),
      {
        prompt: 'The character turns around',
        duration: 5,
        resolution: '2K',
        prompt_expansion_mode: null,
        image_url: 'https://example.com/a.jpg',
      },
    );
  });

  test('normalizes settings when switching from LTX to MiniMax H3', () => {
    const generation = applyGenerationInput(
      {
        ...structuredClone(DEFAULT_GENERATION),
        model: LTX_23_FAST_VIDEO_MODEL,
        durationSeconds: 6,
        frameRate: 25,
        resolution: '1080p',
        aspectRatio: '16:9',
        enableAudio: true,
      },
      { model: MINIMAX_H3_VIDEO_MODEL },
    );

    assert.equal(generation.model, MINIMAX_H3_VIDEO_MODEL);
    assert.equal(generation.durationSeconds, 6);
    assert.equal(generation.frameRate, 24);
    assert.equal(generation.resolution, '480P');
    assert.equal(generation.aspectRatio, '16:9');
    assert.equal(generation.enableAudio, false);
  });

  test('keeps the existing LTX request mapping', () => {
    const input = generationInput({
      model: LTX_23_FAST_VIDEO_MODEL,
      durationSeconds: 6,
      frameRate: 25,
      resolution: '1080p',
      aspectRatio: '16:9',
      enableAudio: true,
    });

    assert.equal(
      videoEndpointFor(LTX_23_FAST_VIDEO_MODEL, 'image-to-video'),
      LTX_23_FAST_IMAGE_ENDPOINT,
    );
    assert.deepEqual(ltx23FastInput(input, 'A moving camera', null), {
      prompt: 'A moving camera',
      duration: 6,
      fps: 25,
      generate_audio: true,
      resolution: '1080p',
      aspect_ratio: '16:9',
    });
  });
});

function generationInput(generation: Partial<GenerationInput['generation']>): GenerationInput {
  const worldId = 'video-world';
  const settings = { ...structuredClone(DEFAULT_GENERATION), ...generation };
  return {
    world: {
      id: worldId,
      interactionType: 'text',
      name: 'Video world',
      prompt: 'A changing world',
      generation: settings,
      createdAt: new Date(0).toISOString(),
    },
    run: newRun(worldId, 'run-1', 1),
    generation: settings,
    parentSceneId: null,
    sourceOptionId: null,
    branchDirection: null,
  };
}
