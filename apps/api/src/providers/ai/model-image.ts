const MAX_MODEL_IMAGE_BYTES = 10 * 1024 * 1024;
const DEFAULT_RETRY_DELAYS_MS = [250, 750];

export interface ModelImage {
  data: Uint8Array;
  mediaType: string | undefined;
}

type ModelImageDownloader = (input: { url: URL; abortSignal?: AbortSignal }) => Promise<ModelImage>;

interface ModelImageDownloadOptions {
  signal?: AbortSignal;
  download?: ModelImageDownloader;
  retryDelaysMs?: number[];
}

export async function downloadModelImage(
  url: URL,
  {
    signal,
    download = downloadImage,
    retryDelaysMs = DEFAULT_RETRY_DELAYS_MS,
  }: ModelImageDownloadOptions = {},
) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    signal?.throwIfAborted();
    try {
      return await download({ url, abortSignal: signal });
    } catch (error) {
      if (signal?.aborted) throw signal.reason ?? error;
      lastError = error;
      const retryDelay = retryDelaysMs[attempt];
      if (retryDelay === undefined) break;
      await waitForRetry(retryDelay, signal);
    }
  }

  const detail = lastError instanceof Error ? ` ${lastError.message}` : '';
  throw new Error(`Could not load the scene image after 3 attempts.${detail}`, {
    cause: lastError,
  });
}

async function downloadImage({ url, abortSignal }: { url: URL; abortSignal?: AbortSignal }) {
  const response = await fetch(url, { signal: abortSignal, redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`image request returned ${response.status} ${response.statusText}`);
  }

  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > MAX_MODEL_IMAGE_BYTES) {
    throw new Error(`image exceeds the ${MAX_MODEL_IMAGE_BYTES} byte limit`);
  }

  const data = new Uint8Array(await response.arrayBuffer());
  if (data.byteLength > MAX_MODEL_IMAGE_BYTES) {
    throw new Error(`image exceeds the ${MAX_MODEL_IMAGE_BYTES} byte limit`);
  }
  if (data.byteLength === 0) throw new Error('image response was empty');

  return {
    data,
    mediaType: response.headers.get('content-type')?.split(';', 1)[0] || undefined,
  };
}

function waitForRetry(milliseconds: number, signal?: AbortSignal) {
  if (milliseconds <= 0) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener('abort', abort);
      resolve();
    };
    const abort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new DOMException('The operation was aborted', 'AbortError'));
    };
    const timer = setTimeout(finish, milliseconds);
    signal?.addEventListener('abort', abort, { once: true });
  });
}
