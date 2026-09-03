import OpenAI from 'openai';

import type { GenerationInput, ProviderState } from '../../types.js';

const FAL_OPENROUTER_BASE_URL = 'https://fal.run/openrouter/router/openai/v1';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export interface PromptResult {
  prompt: string;
  contextSummary: string;
  selectedComment: string | null;
}

export class PromptProvider {
  async generate(input: GenerationInput, settings: ProviderState): Promise<PromptResult> {
    const fallback = fallbackPrompt(input);
    const provider = resolveProvider(settings);
    if (!provider) return fallback;
    const userText = requestText(input);
    const content = input.generation.initialImageUrl
      ? [
          { type: 'text' as const, text: userText },
          {
            type: 'image_url' as const,
            image_url: { url: input.generation.initialImageUrl, detail: 'low' as const },
          },
        ]
      : userText;
    try {
      const client = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseUrl,
        defaultHeaders:
          provider.kind === 'fal' ? { Authorization: `Key ${provider.apiKey}` } : undefined,
      });
      const response = await client.chat.completions.create({
        model: input.generation.initialImageUrl ? settings.llmVisionModel : settings.llmTextModel,
        temperature: Math.min(2, Math.max(0, settings.llmTemperature)),
        max_tokens: 400,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemPrompt(input.generation.mode, input.generation.stylePreset),
          },
          { role: 'user', content },
        ],
      });
      const value = parseJson(response.choices[0]?.message.content ?? '');
      if (!value?.prompt?.trim()) return fallback;
      return {
        prompt: value.prompt.trim(),
        contextSummary: value.context_summary?.trim() || 'The story advances into a new scene.',
        selectedComment: null,
      };
    } catch {
      return fallback;
    }
  }
}

function resolveProvider(settings: ProviderState) {
  if (settings.falApiKey)
    return { kind: 'fal', apiKey: settings.falApiKey, baseUrl: FAL_OPENROUTER_BASE_URL } as const;
  if (settings.groqApiKey)
    return { kind: 'groq', apiKey: settings.groqApiKey, baseUrl: GROQ_BASE_URL } as const;
  if (settings.openaiApiKey)
    return {
      kind: 'openai',
      apiKey: settings.openaiApiKey,
      baseUrl: process.env.OPENAI_BASE_URL,
    } as const;
  return null;
}

function systemPrompt(mode: string, style: string) {
  const continuity =
    style === 'nightmare' || style === 'chaotic'
      ? 'Introduce one controlled unsettling or surprising change while preserving visual continuity.'
      : 'Keep the same characters, place, and visual language while advancing the action naturally.';
  return `You direct an ongoing generative video world. ${continuity} The mode is ${mode}. Describe one visible next action in present tense under 120 words. Return valid JSON only: {"prompt":"the next visible action","context_summary":"short continuity note"}.`;
}

function requestText(input: GenerationInput) {
  const previous =
    input.run.scenes
      .slice(-5)
      .map((scene) => scene.prompt)
      .join('\n') || 'none';
  return `World: ${input.world.name}\nBase premise: ${input.world.prompt}\nScene: ${input.run.scenes.length + 1}\nPrevious context: ${input.run.currentScene?.contextSummary ?? 'none'}\nPrevious prompts:\n${previous}\nSelected direction: ${input.branchDirection ?? 'none'}`;
}

function fallbackPrompt(input: GenerationInput): PromptResult {
  const direction = input.branchDirection
    ? ` Respond to the direction: ${input.branchDirection}.`
    : '';
  return {
    prompt: `Continue ${input.world.prompt}.${direction}`,
    contextSummary: `Scene ${input.run.scenes.length + 1} continues the world narrative.`,
    selectedComment: null,
  };
}

function parseJson(content: string) {
  const normalized = content
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/, '')
    .trim();
  try {
    return JSON.parse(normalized) as { prompt?: string; context_summary?: string };
  } catch {
    return null;
  }
}
