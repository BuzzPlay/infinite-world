import { findModel } from '@infinite-world/api-contract/model-catalog';

import type { GeneratedScene, GenerationInput, ProviderState } from '../../types.js';
import { uploadContinuityFrame } from '../media/continuity-image.js';
import { FalVideoGenerator } from './fal-video.js';
import { PromptProvider } from './llm.js';

export class VideoGenerator {
  constructor(
    private readonly prompts = new PromptProvider(),
    private readonly falVideo = new FalVideoGenerator(),
  ) {}

  async generate(
    input: GenerationInput,
    settings: ProviderState,
    signal?: AbortSignal,
  ): Promise<GeneratedScene> {
    const prepared = await prepareSceneInput(input, settings, signal);
    const prompt = await this.prompts.generate(prepared.input, settings, signal);
    const model = findModel('video', prepared.input.generation.model);
    if (model?.provider === 'fal') {
      const scene = await this.falVideo.generate(prepared.input, settings, prompt, signal);
      return prepared.sourceContinuityImageUrl
        ? { ...scene, sourceContinuityImageUrl: prepared.sourceContinuityImageUrl }
        : scene;
    }
    throw new Error(`unsupported video model: ${input.generation.model}`);
  }
}

async function prepareSceneInput(
  input: GenerationInput,
  settings: ProviderState,
  signal?: AbortSignal,
) {
  const currentScene = input.run.currentScene;
  if (
    !settings.falApiKey ||
    !currentScene ||
    currentScene.mediaType !== 'video' ||
    currentScene.continuityImageUrl?.trim() ||
    !currentScene.previewUrl.trim()
  ) {
    return { input, sourceContinuityImageUrl: null };
  }

  const continuityImageUrl = await uploadContinuityFrame(
    currentScene.previewUrl,
    settings.falApiKey,
    signal,
  );
  if (!continuityImageUrl) return { input, sourceContinuityImageUrl: null };

  const updatedScene = { ...currentScene, continuityImageUrl };
  input.run.currentScene = updatedScene;
  input.run.scenes = input.run.scenes.map((scene) =>
    scene.id === updatedScene.id ? { ...scene, continuityImageUrl } : scene,
  );
  input.run.continuityImageUrl = continuityImageUrl;
  return { input, sourceContinuityImageUrl: continuityImageUrl };
}
