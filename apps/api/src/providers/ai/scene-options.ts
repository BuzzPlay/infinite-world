import type { SceneSnapshot, WorldSnapshot } from '@infinite-world/api-contract';
import { generateObject, type ModelMessage } from 'ai';
import { z } from 'zod';

import type { ProviderState } from '../../types.js';
import { downloadModelImage, type ModelImage } from './model-image.js';
import { resolveVisionModel } from './vision-model.js';

const optionsSchema = z.object({
  options: z
    .array(z.string().trim().min(1).max(120))
    .length(4)
    .describe('Four distinct actions that can visibly change what happens next'),
});

export interface SceneOptionContext {
  world: WorldSnapshot;
  scene: SceneSnapshot;
  lineage: SceneSnapshot[];
}

export class SceneOptionGenerator {
  async generate(
    context: SceneOptionContext,
    settings: ProviderState,
    signal?: AbortSignal,
  ): Promise<string[]> {
    const model = resolveVisionModel(context.world.generation.visionModel, settings);
    if (!model) throw new Error('the selected vision model is not configured');

    const request = requestText(context);
    const imageUrl = sceneImageUrl(context.scene);
    const image = imageUrl ? await downloadModelImage(imageUrl, { signal }) : null;
    if (context.scene.mediaType === 'video' && !image) {
      throw new Error('the generated video does not have an available final frame');
    }
    const result = await generateObject({
      model,
      schema: optionsSchema,
      schemaName: 'scene_options',
      system:
        'Create exactly four short, clearly different actions a person can choose to shape the next scene of an interactive world. Use the supplied final frame as the visual truth. Preserve the characters, setting, time, and visible cause-and-effect, while advancing the story with interesting playable choices. Cover meaningfully different directions such as exploration, interaction, risk, and observation when they fit the scene. Do not repeat or lightly rephrase any existing option. Each option must describe one concrete visible action and contain no labels or explanations.',
      ...(image ? { messages: imageMessages(request, image) } : { prompt: request }),
      maxOutputTokens: 300,
      maxRetries: 3,
      temperature: 0.85,
      abortSignal: signal,
    });

    return result.object.options.map((option) => option.trim());
  }
}

function requestText({ world, scene, lineage }: SceneOptionContext) {
  const recentScenes = lineage
    .slice(-5)
    .map((item) => `Scene ${item.sequence}: ${item.contextSummary || item.prompt}`)
    .join('\n');
  const previousOptions = scene.options.map((option) => option.title).join('\n');

  return `World: ${world.name}
Premise: ${world.prompt}
Current scene prompt: ${scene.prompt}
Current scene summary: ${scene.contextSummary || 'none'}
Recent scenes:
${recentScenes || 'none'}
Options to replace:
${previousOptions || 'none'}

Generate a genuinely new set of choices. The final frame is the state immediately before the next choice.`;
}

function sceneImageUrl(scene: SceneSnapshot) {
  const continuityImage = scene.continuityImageUrl?.trim();
  try {
    if (continuityImage) return new URL(continuityImage);
    if (scene.mediaType !== 'image' || !scene.previewUrl.trim()) return null;
    return new URL(scene.previewUrl);
  } catch {
    return null;
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
