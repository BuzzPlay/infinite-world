import { spawn } from 'node:child_process';

import { config } from '../../config.js';
import type { GenerationInput, GeneratedScene } from '../../types.js';

interface RunnerResponse {
  error?: string;
  media_type?: string;
  preview_url?: string;
  video_url?: string;
  image_url?: string;
  video_base64?: string;
  image_base64?: string;
  frames?: string[];
  frame_mime_type?: string;
  context_summary?: string;
  prompt?: string;
  generation_latency_ms?: number;
}

export class LocalRunnerGenerator {
  async generate(input: GenerationInput, prompt: { prompt: string; contextSummary: string; selectedComment: string | null }): Promise<GeneratedScene> {
    if (!config.localGenerator) throw new Error('configure INFINITE_WORLD_LOCAL_GENERATOR for local generation');
    const payload = {
      model_type: input.generation.model,
      sequence: input.run.scenes.length + 1,
      prompt: prompt.prompt,
      negative_prompt: input.generation.negativePrompt,
      image_url: input.generation.initialImageUrl,
      width: input.generation.width,
      height: input.generation.height,
      num_frames: input.generation.numFrames,
      frame_rate: input.generation.frameRate,
      strength: input.generation.strength,
      guidance_scale: input.generation.guidanceScale,
      timesteps: input.generation.timesteps,
      target_fps: input.generation.targetFps,
      stg_scale: input.generation.stgScale,
      spatio_temporal_guidance_blocks: input.generation.spatioTemporalGuidanceBlocks,
      noise_scale: input.generation.noiseScale,
      enable_audio: input.generation.enableAudio,
      character_refs: input.generation.characterRefs,
    };
    const started = performance.now();
    const response = await runNdjson(config.localGenerator, payload);
    if (response.error?.trim()) throw new Error(response.error);
    const mime = response.frame_mime_type?.trim() || 'image/jpeg';
    const frame = response.frames?.at(-1);
    const previewUrl = response.preview_url || response.video_url || response.image_url
      || dataUrl(response.video_base64, 'video/mp4')
      || dataUrl(response.image_base64, mime)
      || dataUrl(frame, mime);
    if (!previewUrl) throw new Error('local generator returned no preview media');
    const mediaType = response.media_type?.startsWith('video') || response.video_url || response.video_base64 ? 'video' : 'image';
    return {
      prompt: response.prompt?.trim() || prompt.prompt,
      contextSummary: response.context_summary?.trim() || prompt.contextSummary,
      selectedComment: prompt.selectedComment,
      previewUrl,
      mediaType,
      continuityImageUrl: frame ? dataUrl(frame, mime) : null,
      generationLatencyMs: response.generation_latency_ms || Math.max(1, Math.round(performance.now() - started)),
    };
  }
}

async function runNdjson(command: string, payload: unknown): Promise<RunnerResponse> {
  const parts = parseCommand(command);
  if (!parts.length) throw new Error('INFINITE_WORLD_LOCAL_GENERATOR cannot be empty');
  const child = spawn(parts[0], parts.slice(1), { stdio: ['pipe', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (chunk: Buffer) => {
    stderr = `${stderr}${chunk.toString()}`.slice(-4_096);
  });
  const result = new Promise<RunnerResponse>((resolve, reject) => {
    let output = '';
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback();
    };
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      finish(() => reject(new Error('local generation timed out after 30 minutes')));
    }, 30 * 60 * 1_000);
    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      const line = output.split('\n')[0]?.trim();
      if (!line) return;
      try {
        finish(() => resolve(JSON.parse(line) as RunnerResponse));
        child.kill('SIGTERM');
      } catch {
        // Wait for a complete JSON line.
      }
    });
    child.on('error', (error) => finish(() => reject(error)));
    child.on('exit', (code) => {
      if (settled) return;
      const detail = stderr.trim();
      finish(() => reject(new Error(detail ? `local generator exited with ${code}: ${detail}` : `local generator exited with ${code ?? 'signal'}`)));
    });
  });
  child.stdin.write(`${JSON.stringify(payload)}\n`);
  child.stdin.end();
  return result;
}

function dataUrl(value: string | undefined, mime: string) {
  return value?.trim() ? `data:${mime};base64,${value.trim()}` : undefined;
}

function parseCommand(command: string) {
  const parts: string[] = [];
  let current = '';
  let quote = '';
  let escaped = false;
  let started = false;
  for (const character of command.trim()) {
    if (escaped) {
      current += character;
      escaped = false;
      started = true;
      continue;
    }
    if (character === '\\' && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = '';
      else current += character;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      started = true;
    } else if (/\s/.test(character)) {
      if (started) {
        parts.push(current);
        current = '';
        started = false;
      }
    } else {
      current += character;
      started = true;
    }
  }
  if (escaped) current += '\\';
  if (quote) throw new Error('INFINITE_WORLD_LOCAL_GENERATOR has an unterminated quote');
  if (started) parts.push(current);
  return parts;
}
