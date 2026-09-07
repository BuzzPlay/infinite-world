import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnvironment } from 'dotenv';

import { corsOriginsFromEnv } from './shared/cors.js';

loadEnvironment({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });

export const config = {
  host: process.env.INFINITE_WORLD_HOST?.trim() || '127.0.0.1',
  port: numberFromEnv('INFINITE_WORLD_PORT', 4000, 1, 65_535),
  corsOrigins: corsOriginsFromEnv(process.env.INFINITE_WORLD_CORS_ORIGINS),
  dataDir: dataDirectoryPath(),
  ffmpegBinary: process.env.INFINITE_WORLD_FFMPEG_BIN?.trim() || 'ffmpeg',
  whisperBinary: process.env.INFINITE_WORLD_WHISPER_BIN?.trim() || 'whisper-cli',
  whisperModelPath: process.env.INFINITE_WORLD_WHISPER_MODEL?.trim(),
};

function numberFromEnv(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

function dataDirectoryPath() {
  if (process.env.INFINITE_WORLD_DATA_DIR?.trim()) {
    return process.env.INFINITE_WORLD_DATA_DIR;
  }
  if (process.env.XDG_STATE_HOME?.trim()) {
    return join(process.env.XDG_STATE_HOME, 'infinite-world');
  }
  return join(homedir(), '.infinite-world');
}
