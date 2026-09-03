import { spawn, type ChildProcess } from 'node:child_process';

import { config } from '../../config.js';
import type { LiveOutputSettings } from '@infinite-world/api-contract';

export class FfmpegOutput {
  private child: ChildProcess | null = null;

  start(output: LiveOutputSettings, mediaUrl: string) {
    this.stop();
    if (output.mode !== 'rtmp') return;
    if (!output.streamKey.trim()) throw new Error('stream key is required for RTMP output');
    const endpoint = `${output.endpoint.replace(/\/$/, '')}/${output.streamKey}`;
    const child = spawn(config.ffmpegBinary, [
      '-re', '-i', mediaUrl,
      '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
      '-f', 'flv', endpoint,
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    child.on('error', () => { this.child = null; });
    child.on('exit', () => { this.child = null; });
    this.child = child;
  }

  stop() {
    if (!this.child) return;
    this.child.kill('SIGTERM');
    this.child = null;
  }

  get running() {
    return this.child !== null;
  }
}
