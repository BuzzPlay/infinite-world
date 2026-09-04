import { findModel } from '@infinite-world/api-contract/model-catalog';

import type { GenerationInput, GeneratedScene, ProviderState } from '../../types.js';
import { FalVideoGenerator } from './fal-video.js';
import { PromptProvider } from './llm.js';

export class VideoGenerator {
  constructor(
    private readonly prompts = new PromptProvider(),
    private readonly falVideo = new FalVideoGenerator(),
  ) {}

  async generate(input: GenerationInput, settings: ProviderState): Promise<GeneratedScene> {
    const prompt = await this.prompts.generate(input, settings);
    const model = findModel('video', input.generation.model);
    if (model?.provider === 'fal') return this.falVideo.generate(input, settings, prompt);
    throw new Error(`unsupported video model: ${input.generation.model}`);
  }
}
