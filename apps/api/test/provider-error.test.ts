import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { providerErrorMessage } from '../src/providers/ai/provider-error.js';

describe('providerErrorMessage', () => {
  test('includes fal validation fields and omits credentials', () => {
    const message = providerErrorMessage('Seedance video generation failed', {
      status: 422,
      body: { detail: [{ loc: ['body', 'image_url'], msg: 'invalid image URL' }] },
    });

    assert.equal(message, 'Seedance video generation failed (422): body.image_url: invalid image URL');
  });

  test('reads a JSON response body from a vision provider', () => {
    const message = providerErrorMessage('Vision prompt generation failed', {
      statusCode: 422,
      responseBody: '{"error":"unsupported image media type"}',
    });

    assert.equal(message, 'Vision prompt generation failed (422): unsupported image media type');
  });
});
