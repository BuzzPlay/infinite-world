import { fal } from '@fal-ai/client';
import {
  LTX_23_FAST_VIDEO_MODEL,
  MINIMAX_H3_VIDEO_MODEL,
  videoEndpointFor,
} from '@infinite-world/api-contract/model-catalog';
import { z } from 'zod';

import type { GeneratedScene, GenerationInput, ProviderState } from '../../types.js';
import { uploadContinuityFrame } from '../media/continuity-image.js';
import type { PromptResult } from './llm.js';
import { imageForScene } from './scene-input.js';
import { ltx23FastInput } from './video-models/ltx-2.3-fast.js';
import { minimaxH3Input } from './video-models/minimax-h3.js';

const falVideoResultSchema = z.object({
  data: z.object({ video: z.object({ url: z.string().min(1) }) }),
});

export class FalVideoGenerator {
  async generate(
    input: GenerationInput,
    settings: ProviderState,
    prompt: PromptResult,
    signal?: AbortSignal,
  ): Promise<GeneratedScene> {
    if (!settings.falApiKey) throw new Error('configure a provider key before hosted generation');
    const sceneImage = imageForScene(input);
    const inputMode = sceneImage ? 'image-to-video' : 'text-to-video';
    const endpoint = videoEndpointFor(input.generation.model, inputMode);
    if (!endpoint) {
      throw new Error(`video model ${input.generation.model} does not support ${inputMode}`);
    }

    fal.config({ credentials: settings.falApiKey });
    const started = performance.now();
    const result = await fal.subscribe(endpoint, {
      input: falVideoInput(input, prompt.prompt, sceneImage),
      abortSignal: signal,
    });
    const previewUrl = falVideoResultSchema.parse(result).data.video.url;
    const continuityImageUrl = await uploadContinuityFrame(previewUrl, settings.falApiKey, signal);

    return {
      prompt: prompt.prompt,
      contextSummary: prompt.contextSummary,
      selectedComment: prompt.selectedComment,
      previewUrl,
      continuityImageUrl,
      mediaType: 'video',
      generationLatencyMs: Math.max(1, Math.round(performance.now() - started)),
    };
  }
}

function falVideoInput(input: GenerationInput, prompt: string, initialImage: string | null) {
  if (input.generation.model === LTX_23_FAST_VIDEO_MODEL) {
    return ltx23FastInput(input, prompt, initialImage);
  }
  if (input.generation.model === MINIMAX_H3_VIDEO_MODEL) {
    return minimaxH3Input(input, prompt, initialImage);
  }
  throw new Error(`unsupported FAL video model: ${input.generation.model}`);
}
