import { spawn } from 'node:child_process';

import { config } from '../../config.js';

/** Extracts a small, publicly uploadable keyframe without keeping the video locally. */
export function extractLastFrame(videoUrl: string, signal?: AbortSignal): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      config.ffmpegBinary,
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-sseof',
        '-0.2',
        '-i',
        videoUrl,
        '-frames:v',
        '1',
        '-an',
        '-f',
        'image2pipe',
        '-vcodec',
        'mjpeg',
        'pipe:1',
      ],
      { stdio: ['ignore', 'pipe', 'ignore'] },
    );
    const chunks: Buffer[] = [];
    let settled = false;

    let abort = () => undefined;
    const cleanup = () => signal?.removeEventListener('abort', abort);
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    abort = () => {
      child.kill('SIGTERM');
      finish(() => reject(signal?.reason ?? new Error('continuity frame extraction aborted')));
    };

    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.once('error', () => finish(() => resolve(null)));
    child.once('close', (code) => {
      if (code !== 0 || chunks.length === 0) {
        finish(() => resolve(null));
        return;
      }
      finish(() => resolve(Buffer.concat(chunks)));
    });
    if (signal?.aborted) {
      abort();
    } else {
      signal?.addEventListener('abort', abort, { once: true });
    }
  });
}
