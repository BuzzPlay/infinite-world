import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { downloadModelImage } from '../src/providers/ai/model-image.js';

describe('model image download', () => {
  test('retries transient download failures', async () => {
    let attempts = 0;
    const image = await downloadModelImage(new URL('https://example.com/scene.jpeg'), {
      retryDelaysMs: [0, 0],
      download: async () => {
        attempts += 1;
        if (attempts < 3) throw new TypeError('fetch failed');
        return { data: new Uint8Array([1, 2, 3]), mediaType: 'image/jpeg' };
      },
    });

    assert.equal(attempts, 3);
    assert.deepEqual(image, {
      data: new Uint8Array([1, 2, 3]),
      mediaType: 'image/jpeg',
    });
  });

  test('reports an error after all download attempts fail', async () => {
    let attempts = 0;

    await assert.rejects(
      downloadModelImage(new URL('https://example.com/scene.jpeg'), {
        retryDelaysMs: [0, 0],
        download: async () => {
          attempts += 1;
          throw new TypeError('fetch failed');
        },
      }),
      /Could not load the scene image after 3 attempts/,
    );
    assert.equal(attempts, 3);
  });
});
