import { fal } from '@fal-ai/client';

/** Converts browser-local image data into a URL accepted by hosted video models. */
export async function uploadInputImage(
  imageUrl: string | null,
  falApiKey: string,
  signal?: AbortSignal,
) {
  if (!imageUrl?.startsWith('data:')) return imageUrl;

  const response = await fetch(imageUrl, { signal });
  if (!response.ok) throw new Error('Could not read the initial image.');

  const contentType = response.headers.get('content-type') || 'image/png';
  if (!contentType.startsWith('image/')) {
    throw new Error('The initial image must be an image file.');
  }

  fal.config({ credentials: falApiKey });
  return fal.storage.upload(new Blob([await response.arrayBuffer()], { type: contentType }), {
    lifecycle: { expiresIn: 'never' },
  });
}
