import type { SceneSnapshot, WorldSnapshot } from '@infinite-world/api-contract';
import { generateObject, type ModelMessage } from 'ai';
import { z } from 'zod';

import type { GeneratedInteractiveRegion, ProviderState } from '../../types.js';
import { downloadModelImage, type ModelImage } from './model-image.js';
import { optionLanguageInstruction } from './option-language.js';
import { resolveVisionModel } from './vision-model.js';

const regionSchema = z.object({
  regions: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(48),
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        width: z.number().gt(0).max(1),
        height: z.number().gt(0).max(1),
        options: z.array(z.string().trim().min(1).max(120)).min(2).max(4),
      }),
    )
    .min(1)
    .max(6),
});

export class ImageInteractionGenerator {
  async generate(
    world: WorldSnapshot,
    scene: ImageInteractionScene,
    settings: ProviderState,
    signal?: AbortSignal,
  ): Promise<GeneratedInteractiveRegion[]> {
    const model = resolveVisionModel(world.generation.visionModel, settings);
    if (!model) throw new Error('the selected vision model is not configured');
    const imageUrl = scene.continuityImageUrl?.trim();
    if (!imageUrl) throw new Error('the generated video does not have a final frame');

    const image = await downloadModelImage(new URL(imageUrl), { signal });
    const result = await generateObject({
      model,
      schema: regionSchema,
      schemaName: 'image_interaction_regions',
      system: `Find the most meaningful visible objects or areas a player can interact with in the supplied final frame. Return normalized bounding boxes where x and y are the top-left position and width and height are the box size, all from 0 to 1. Avoid overlapping boxes, faces without a meaningful action, background texture, and tiny details. Give each region two to four distinct, concrete actions that would visibly change the next scene. Use the image as the visual truth and preserve the world premise. ${optionLanguageInstruction(world.optionLanguage)} Reply with JSON only: {"regions":[{"label":"...","x":0.1,"y":0.1,"width":0.2,"height":0.2,"options":["...","..."]}]}. Do not use Markdown or add any text outside the JSON object.`,
      messages: imageMessages(requestText(world, scene), image),
      maxOutputTokens: 900,
      maxRetries: 3,
      abortSignal: signal,
    });

    return normalizeRegions(
      result.object.regions.map((region) => ({
        ...region,
        options: region.options.map((option) => option.trim()),
      })),
    );
  }
}

function normalizeRegions(regions: GeneratedInteractiveRegion[]) {
  const kept: GeneratedInteractiveRegion[] = [];
  for (const region of [...regions].sort((left, right) => area(left) - area(right))) {
    if (kept.some((candidate) => overlapRatio(region, candidate) > 0.6)) continue;
    kept.push(region);
  }
  return kept;
}

function area(region: GeneratedInteractiveRegion) {
  return region.width * region.height;
}

function overlapRatio(left: GeneratedInteractiveRegion, right: GeneratedInteractiveRegion) {
  const intersectionWidth = Math.max(
    0,
    Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x),
  );
  const intersectionHeight = Math.max(
    0,
    Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y),
  );
  return (intersectionWidth * intersectionHeight) / Math.min(area(left), area(right));
}

function requestText(world: WorldSnapshot, scene: ImageInteractionScene) {
  return `World: ${world.name}\nPremise: ${world.prompt}\nCurrent scene: ${scene.contextSummary || scene.prompt}\nIdentify objects and areas that invite a meaningful next interaction.`;
}

type ImageInteractionScene = Pick<SceneSnapshot, 'contextSummary' | 'prompt'> & {
  continuityImageUrl?: string | null;
};

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
