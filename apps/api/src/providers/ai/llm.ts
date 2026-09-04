import { createGoogle } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateObject, type LanguageModel, type ModelMessage } from 'ai';
import { z } from 'zod';

import { findModel } from '@infinite-world/api-contract/model-catalog';
import type { GenerationInput, ProviderState } from '../../types.js';
import { initialImageForScene } from './scene-input.js';

const sceneSchema = z.object({
  prompt: z.string().min(1),
  context_summary: z.string().optional(),
});

const FAL_OPENROUTER_BASE_URL = 'https://fal.run/openrouter/router/openai/v1';

export interface PromptResult {
  prompt: string;
  contextSummary: string;
  selectedComment: string | null;
}

export class PromptProvider {
  async generate(input: GenerationInput, settings: ProviderState): Promise<PromptResult> {
    const fallback = fallbackPrompt(input);
    const model = resolveModel(input, settings);
    if (!model) return fallback;
    const initialImage = initialImageForScene(input);

    try {
      const result = await generateObject({
        model,
        schema: sceneSchema,
        schemaName: 'scene_progression',
        system: systemPrompt(input.generation.mode, input.generation.stylePreset),
        ...(initialImage
          ? { messages: imageMessages(requestText(input), initialImage) }
          : { prompt: requestText(input) }),
        maxOutputTokens: 400,
        maxRetries: 1,
      });
      const value = result.object;
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

function resolveModel(input: GenerationInput, settings: ProviderState): LanguageModel | null {
  const definition = findModel('vision', input.generation.visionModel);
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

function imageMessages(text: string, imageUrl: string): ModelMessage[] {
  return [
    {
      role: 'user',
      content: [
        { type: 'text', text },
        { type: 'image', image: new URL(imageUrl) },
      ],
    },
  ];
}

function systemPrompt(mode: string, style: string) {
  const continuity =
    style === 'nightmare' || style === 'chaotic'
      ? 'Introduce one controlled unsettling or surprising change while preserving visual continuity.'
      : 'Keep the same characters, place, and visual language while advancing the action naturally.';
  return `You direct an ongoing generative video world. ${continuity} The mode is ${mode}. Describe one visible next action in present tense under 120 words. Return the requested structured object only.`;
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
