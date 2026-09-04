import { fal } from '@fal-ai/client';
import { z } from 'zod';

import {
  LTX_23_FAST_VIDEO_MODEL,
  videoEndpointFor,
} from '@infinite-world/api-contract/model-catalog';

import type { GeneratedScene, GenerationInput, ProviderState } from '../../types.js';
import type { PromptResult } from './llm.js';
import { initialImageForScene } from './scene-input.js';

const falVideoResultSchema = z.object({
  data: z.object({ video: z.object({ url: z.string().min(1) }) }),
});

interface Ltx23FastInput {
  prompt: string;
  duration: number;
  fps: number;
  generate_audio: boolean;
  resolution: '1080p' | '1440p' | '2160p';
  aspect_ratio: 'auto' | '16:9' | '9:16';
  image_url?: string;
}

export class FalVideoGenerator {
  async generate(
    input: GenerationInput,
    settings: ProviderState,
    prompt: PromptResult,
  ): Promise<GeneratedScene> {
    if (!settings.falApiKey) throw new Error('configure a provider key before hosted generation');
    if (input.generation.model !== LTX_23_FAST_VIDEO_MODEL) {
      throw new Error(`unsupported FAL video model: ${input.generation.model}`);
    }
    const initialImage = initialImageForScene(input);
    const inputMode = initialImage ? 'image-to-video' : 'text-to-video';
    const endpoint = videoEndpointFor(input.generation.model, inputMode);
    if (!endpoint) {
      throw new Error(`video model ${input.generation.model} does not support ${inputMode}`);
    }

    fal.config({ credentials: settings.falApiKey });
    const started = performance.now();
    const result = await fal.subscribe(endpoint, {
      input: ltx23FastInput(input, prompt.prompt, initialImage),
    });
    const previewUrl = falVideoResultSchema.parse(result).data.video.url;

    return {
      prompt: prompt.prompt,
      contextSummary: prompt.contextSummary,
      selectedComment: prompt.selectedComment,
      previewUrl,
      mediaType: 'video',
      generationLatencyMs: Math.max(1, Math.round(performance.now() - started)),
    };
  }
}

function ltx23FastInput(
  input: GenerationInput,
  prompt: string,
  initialImage: string | null,
): Ltx23FastInput {
  const aspectRatio = input.generation.aspectRatio ?? (initialImage ? 'auto' : '16:9');
  return {
    prompt,
    duration: input.generation.durationSeconds,
    fps: input.generation.frameRate,
    generate_audio: input.generation.enableAudio,
    resolution: input.generation.resolution ?? '1080p',
    aspect_ratio: !initialImage && aspectRatio === 'auto' ? '16:9' : aspectRatio,
    ...(initialImage ? { image_url: initialImage } : {}),
  };
}
