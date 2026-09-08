import { createHash, randomUUID } from 'node:crypto';
import { mkdir, rename, stat, writeFile } from 'node:fs/promises';

import { config } from '../../config.js';
import { mediaAssetPath, mediaDirectory } from '../../storage/paths.js';

const MAX_VIDEO_BYTES = 300 * 1024 * 1024;

export async function cacheVideoAsset(sourceUrl: string, signal?: AbortSignal) {
  if (isLocalMediaUrl(sourceUrl)) return sourceUrl;

  const mediaId = createHash('sha256').update(sourceUrl).digest('hex').slice(0, 32);
  const destination = mediaAssetPath(config.dataDir, mediaId);
  if (await fileExists(destination)) return localMediaUrl(mediaId);

  const response = await fetch(sourceUrl, { signal });
  if (!response.ok) throw new Error(`Could not download generated video (${response.status})`);

  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_VIDEO_BYTES) {
    throw new Error('Generated video is too large to cache locally');
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_VIDEO_BYTES)
    throw new Error('Generated video is too large to cache locally');

  await mkdir(mediaDirectory(config.dataDir), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  await writeFile(temporary, bytes, { mode: 0o600 });
  try {
    await rename(temporary, destination);
  } catch (error) {
    if (!(await fileExists(destination))) throw error;
  }
  return localMediaUrl(mediaId);
}

export function isLocalMediaUrl(value: string) {
  try {
    return new URL(value).pathname.startsWith('/api/media/');
  } catch {
    return false;
  }
}

export function localMediaUrl(mediaId: string) {
  const host = config.host === '0.0.0.0' ? '127.0.0.1' : config.host;
  return `http://${host}:${config.port}/api/media/${mediaId}`;
}

async function fileExists(path: string) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}
