import { createGoogle } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';

import { findModel } from '@infinite-world/api-contract/model-catalog';
import type { ProviderState } from '../../types.js';

const FAL_OPENROUTER_BASE_URL = 'https://fal.run/openrouter/router/openai/v1';

export function resolveVisionModel(modelId: string, settings: ProviderState): LanguageModel | null {
  const definition = findModel('vision', modelId);
  if (!definition?.modelId) return null;

  if (definition.provider === 'google' && settings.googleApiKey) {
    return createGoogle({ apiKey: settings.googleApiKey })(definition.modelId);
  }

  if (definition.provider === 'fal' && settings.falApiKey) {
    return createOpenAICompatible({
      baseURL: FAL_OPENROUTER_BASE_URL,
      headers: { Authorization: `Key ${settings.falApiKey}` },
      name: 'fal',
      supportsStructuredOutputs: true,
    })(definition.modelId);
  }

  return null;
}
