import { fal } from '@fal-ai/client';

import type { GenerationInput, GeneratedScene, ProviderState } from '../../types.js';
import { DemoGenerator } from './demo.js';
import { PromptProvider } from './llm.js';
import { LocalRunnerGenerator } from './local.js';

export class VideoGenerator {
  constructor(
    private readonly prompts = new PromptProvider(),
    private readonly demo = new DemoGenerator(),
    private readonly local = new LocalRunnerGenerator(),
  ) {}

  async generate(input: GenerationInput, settings: ProviderState): Promise<GeneratedScene> {
    if (input.generation.model === 'demo-continuous') return this.demo.generate(input);
    const prompt = await this.prompts.generate(input, settings);
    if (isLocalModel(input.generation.model)) return this.local.generate(input, prompt);
    return this.generateHosted(input, settings, prompt);
  }

  private async generateHosted(input: GenerationInput, settings: ProviderState, prompt: { prompt: string; contextSummary: string; selectedComment: string | null }) {
    if (!settings.falApiKey) throw new Error('configure a provider key before hosted generation');
    fal.config({ credentials: settings.falApiKey });
    const model = input.generation.model === 'fal-ltx-2.3' || input.generation.model === 'ltx-2.3'
      ? 'fal-ai/ltx-2.3/image-to-video/fast'
      : 'fal-ai/ltx-video';
    const started = performance.now();
    const result = await fal.subscribe(model, {
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
    const output = (result as { data?: { video?: { url?: string } }; video?: { url?: string } }).data ?? result;
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

function isLocalModel(model: string) {
  return model === 'ltxv1' || model === 'ltx-2.3-local' || model === 'ltx-2.3-condition';
}
