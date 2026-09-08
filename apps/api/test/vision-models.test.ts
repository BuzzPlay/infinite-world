import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  OPENAI_GPT_6_ASTRA_MODEL,
  findModel,
  isModelConfigured,
} from '@infinite-world/api-contract/model-catalog';

describe('vision model catalog', () => {
  test('exposes GPT-6 Astra through the OpenAI-compatible provider', () => {
    const model = findModel('vision', OPENAI_GPT_6_ASTRA_MODEL);

    assert.deepEqual(model, {
      id: OPENAI_GPT_6_ASTRA_MODEL,
      label: 'GPT-6 Astra',
      provider: 'openai',
      modelId: 'gpt-6-astra',
      apiKey: 'openaiApiKey',
    });
    assert.equal(
      isModelConfigured('vision', OPENAI_GPT_6_ASTRA_MODEL, {
        googleApiKeyConfigured: false,
        openaiApiKeyConfigured: true,
        falApiKeyConfigured: false,
      }),
      true,
    );
  });
});
