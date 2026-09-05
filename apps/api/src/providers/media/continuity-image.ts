import { fal } from '@fal-ai/client';

import { extractLastFrame } from './continuity-frame.js';

export async function uploadContinuityFrame(
  videoUrl: string,
  falApiKey: string,
  signal?: AbortSignal,
) {
  fal.config({ credentials: falApiKey });
  const frame = await extractLastFrame(videoUrl, signal);
  if (!frame) {
    console.warn('Could not extract a continuity frame from the generated video.');
    return null;
  }

  try {
    return await fal.storage.upload(new Blob([frame], { type: 'image/jpeg' }), {
      lifecycle: { expiresIn: 'never' },
    });
  } catch (error) {
    if (signal?.aborted) throw signal.reason ?? error;
    console.warn('Could not upload the continuity frame.', error);
    return null;
  }
}
