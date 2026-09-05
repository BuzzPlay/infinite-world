import type { GenerationInput } from '../../types.js';

export function imageForScene(input: GenerationInput) {
  const currentScene = input.run.currentScene;
  const previousFrame = currentScene?.continuityImageUrl?.trim();
  if (previousFrame) return previousFrame;
  if (currentScene?.mediaType === 'image' && currentScene.previewUrl.trim()) {
    return currentScene.previewUrl.trim();
  }
  if (input.run.scenes.length > 0) return null;
  return input.generation.initialImageUrl?.trim() || null;
}
