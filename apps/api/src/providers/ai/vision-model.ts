import { createGoogle } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { findModel } from '@infinite-world/api-contract/model-catalog';
import type { LanguageModel } from 'ai';
import { OPENAI_DEFAULT_BASE_URL } from '../../services/settings-service.js';
import type { ProviderState } from '../../types.js';

const FAL_OPENROUTER_BASE_URL = 'https://fal.run/openrouter/router/openai/v1';

export function resolveVisionModel(modelId: string, settings: ProviderState): LanguageModel | null {
  const definition = findModel('vision', modelId);
  if (!definition?.modelId) return null;

  if (definition.provider === 'google' && settings.googleApiKey) {
    return createGoogle({ apiKey: settings.googleApiKey })(definition.modelId);
  }

  if (definition.provider === 'openai' && settings.openaiApiKey) {
    return createOpenAICompatible({
      baseURL: settings.openaiBaseUrl,
      headers: { Authorization: `Bearer ${settings.openaiApiKey}` },
      name: 'openai-compatible',
      supportsStructuredOutputs: settings.openaiBaseUrl === OPENAI_DEFAULT_BASE_URL,
    })(definition.modelId);
  }

  if (definition.provider === 'fal' && settings.falApiKey) {
    return createOpenAICompatible({
      baseURL: FAL_OPENROUTER_BASE_URL,
      headers: { Authorization: `Key ${settings.falApiKey}` },
      name: 'fal',
      // Fal's Gemini gateway accepts JSON-object mode more reliably than OpenAI's
      // strict json_schema response format. The callers still validate with Zod.
      supportsStructuredOutputs: false,
    })(definition.modelId);
  }

  return null;
}
