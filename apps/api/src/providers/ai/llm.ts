import { createGoogle } from '@ai-sdk/google';
import { generateObject, type LanguageModel, type ModelMessage } from 'ai';
import { z } from 'zod';

import { findModel } from '@infinite-world/api-contract/model-catalog';
import type { GenerationInput, ProviderState } from '../../types.js';

const sceneSchema = z.object({
  prompt: z.string().min(1),
  context_summary: z.string().optional(),
});

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

    try {
      const result = await generateObject({
        model,
        schema: sceneSchema,
        schemaName: 'scene_progression',
        system: systemPrompt(input.generation.mode, input.generation.stylePreset),
        ...(input.generation.initialImageUrl
          ? { messages: imageMessages(requestText(input), input.generation.initialImageUrl) }
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
  if (!settings.googleApiKey) return null;
  const definition = findModel('vision', input.generation.visionModel);
  if (definition?.provider !== 'google' || !definition.modelId) return null;
  return createGoogle({ apiKey: settings.googleApiKey })(definition.modelId);
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
