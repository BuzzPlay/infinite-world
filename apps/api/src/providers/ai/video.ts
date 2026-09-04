import { fal } from '@fal-ai/client';
import { findModel } from '@infinite-world/api-contract/model-catalog';

import type { GenerationInput, GeneratedScene, ProviderState } from '../../types.js';
import { PromptProvider } from './llm.js';

export class VideoGenerator {
  constructor(private readonly prompts = new PromptProvider()) {}

  async generate(input: GenerationInput, settings: ProviderState): Promise<GeneratedScene> {
    const prompt = await this.prompts.generate(input, settings);
    return this.generateHosted(input, settings, prompt, input.generation.model);
  }

  private async generateHosted(
    input: GenerationInput,
    settings: ProviderState,
    prompt: { prompt: string; contextSummary: string; selectedComment: string | null },
    modelId: string,
  ) {
    if (!settings.falApiKey) throw new Error('configure a provider key before hosted generation');
    const model = findModel('video', modelId);
    if (model?.provider !== 'fal' || !model.modelId)
      throw new Error(`unsupported video model: ${input.generation.model}`);
    fal.config({ credentials: settings.falApiKey });
    const started = performance.now();
    const result = await fal.subscribe(model.modelId, {
      input: {
        prompt: prompt.prompt,
        negative_prompt: input.generation.negativePrompt,
        image_url: input.generation.initialImageUrl ?? undefined,
        guidance_scale: input.generation.guidanceScale,
        num_inference_steps: input.generation.timesteps.length,
        seed: input.generation.seed ?? undefined,
        width: input.generation.width,
        height: input.generation.height,
        duration: input.generation.durationSeconds,
        fps: input.generation.frameRate,
        generate_audio: input.generation.enableAudio,
        resolution: input.generation.resolution ?? undefined,
        aspect_ratio: input.generation.aspectRatio ?? undefined,
      } as never,
    });
    const output =
      (result as { data?: { video?: { url?: string } }; video?: { url?: string } }).data ?? result;
    const previewUrl = (output as { video?: { url?: string } }).video?.url;
    if (!previewUrl) throw new Error('video provider returned no preview URL');
    return {
      prompt: prompt.prompt,
      contextSummary: prompt.contextSummary,
      selectedComment: prompt.selectedComment,
      previewUrl,
      mediaType: 'video' as const,
      continuityImageUrl: input.generation.initialImageUrl,
      generationLatencyMs: Math.max(1, Math.round(performance.now() - started)),
    };
  }
}
