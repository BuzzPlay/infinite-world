import { fal } from '@fal-ai/client';
import {
  LTX_23_FAST_VIDEO_MODEL,
  MINIMAX_H3_VIDEO_MODEL,
  SEEDANCE_25_VIDEO_MODEL,
  videoEndpointFor,
} from '@infinite-world/api-contract/model-catalog';
import { z } from 'zod';

import type { GeneratedScene, GenerationInput, ProviderState } from '../../types.js';
import { uploadContinuityFrame } from '../media/continuity-image.js';
import { uploadInputImage } from '../media/input-image.js';
import { cacheVideoAsset } from '../media/video-cache.js';
import type { PromptResult } from './llm.js';
import { providerErrorMessage } from './provider-error.js';
import { imageForScene } from './scene-input.js';
import { ltx23FastInput } from './video-models/ltx-2.3-fast.js';
import { minimaxH3Input } from './video-models/minimax-h3.js';
import { seedance25Input } from './video-models/seedance-2.5.js';

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
    let sceneImage: string | null;
    try {
      sceneImage = await uploadInputImage(imageForScene(input), settings.falApiKey, signal);
    } catch (error) {
      throw new Error(providerErrorMessage('Initial image upload to fal failed', error), {
        cause: error,
      });
    }
    const inputMode = sceneImage ? 'image-to-video' : 'text-to-video';
    const endpoint = videoEndpointFor(input.generation.model, inputMode);
    if (!endpoint) {
      throw new Error(`video model ${input.generation.model} does not support ${inputMode}`);
    }

    fal.config({ credentials: settings.falApiKey });
    const started = performance.now();
    const result = await fal
      .subscribe(endpoint, {
        input: falVideoInput(input, prompt.prompt, sceneImage),
        abortSignal: signal,
      })
      .catch((error) => {
        throw new Error(
          providerErrorMessage(`${input.generation.model} video generation failed`, error),
          { cause: error },
        );
      });
    const remoteVideoUrl = falVideoResultSchema.parse(result).data.video.url;
    const continuityImageUrl = await uploadContinuityFrame(
      remoteVideoUrl,
      settings.falApiKey,
      signal,
    );
    const previewUrl = await cacheVideoAsset(remoteVideoUrl, signal).catch((error) => {
      console.warn('Could not cache the generated video locally.', error);
      return remoteVideoUrl;
    });

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
  if (input.generation.model === SEEDANCE_25_VIDEO_MODEL) {
    return seedance25Input(input, prompt, initialImage);
  }
  throw new Error(`unsupported FAL video model: ${input.generation.model}`);
}
