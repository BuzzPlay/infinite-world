import { generateObject, type ModelMessage } from 'ai';
import { z } from 'zod';

import type { GenerationInput, ProviderState } from '../../types.js';
import { downloadModelImage, type ModelImage } from './model-image.js';
import { providerErrorMessage } from './provider-error.js';
import { imageForScene } from './scene-input.js';
import { resolveVisionModel } from './vision-model.js';

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
  async generate(
    input: GenerationInput,
    settings: ProviderState,
    signal?: AbortSignal,
  ): Promise<PromptResult> {
    const model = resolveVisionModel(input.generation.visionModel, settings);
    if (!model) throw new Error('the selected vision model is not configured');
    try {
      const sceneImageUrl = imageForScene(input);
      const sceneImage = sceneImageUrl
        ? await downloadModelImage(new URL(sceneImageUrl), { signal })
        : null;

      const result = await generateObject({
        model,
        schema: sceneSchema,
        schemaName: 'scene_progression',
        system: systemPrompt(input.generation.mode, input.generation.stylePreset),
        ...(sceneImage
          ? { messages: imageMessages(requestText(input), sceneImage) }
          : { prompt: requestText(input) }),
        maxOutputTokens: 400,
        maxRetries: 1,
        abortSignal: signal,
      });
      const value = result.object;
      return {
        prompt: value.prompt.trim(),
        contextSummary: value.context_summary?.trim() || 'The story advances into a new scene.',
        selectedComment: null,
      };
    } catch (error) {
      throw new Error(providerErrorMessage('Vision prompt generation failed', error), {
        cause: error,
      });
    }
  }
}

function imageMessages(text: string, image: ModelImage): ModelMessage[] {
  return [
    {
      role: 'user',
      content: [
        { type: 'text', text },
        { type: 'image', image: image.data, mediaType: image.mediaType },
      ],
    },
  ];
}

function systemPrompt(mode: string, style: string) {
  const continuity =
    style === 'nightmare' || style === 'chaotic'
      ? 'Introduce one controlled unsettling or surprising change while preserving visual continuity.'
      : 'Keep the same characters, place, and visual language while advancing the action naturally.';
  return `You direct an ongoing generative video world. ${continuity} The mode is ${mode}. Describe one visible next action in present tense under 120 words. Reply with JSON only: {"prompt":"...","context_summary":"..."}. "prompt" is required. "context_summary" is optional and briefly records the resulting visual state. Do not use Markdown or add any text outside the JSON object.`;
}

function requestText(input: GenerationInput) {
  const previous =
    input.run.scenes
      .slice(-5)
      .map((scene) => scene.prompt)
      .join('\n') || 'none';
  return `World: ${input.world.name}\nBase premise: ${input.world.prompt}\nScene: ${input.run.scenes.length + 1}\nPrevious context: ${input.run.currentScene?.contextSummary ?? 'none'}\nPrevious prompts:\n${previous}\nSelected direction: ${input.branchDirection ?? 'none'}`;
}
