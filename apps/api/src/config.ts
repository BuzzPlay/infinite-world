import { homedir } from 'node:os';
import { join } from 'node:path';

export const config = {
  host: process.env.INFINITE_WORLD_HOST?.trim() || '127.0.0.1',
  port: numberFromEnv('INFINITE_WORLD_PORT', 4000, 1, 65_535),
  dataFile: dataFilePath(),
  ffmpegBinary: process.env.INFINITE_WORLD_FFMPEG_BIN?.trim() || 'ffmpeg',
  localGenerator: process.env.INFINITE_WORLD_LOCAL_GENERATOR?.trim() || null,
};

function numberFromEnv(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

function dataFilePath() {
  if (process.env.INFINITE_WORLD_DATA_FILE?.trim()) return process.env.INFINITE_WORLD_DATA_FILE;
  if (process.env.INFINITE_WORLD_DATA_DIR?.trim()) {
    return join(process.env.INFINITE_WORLD_DATA_DIR, 'state.json');
  }
  if (process.env.XDG_STATE_HOME?.trim()) {
    return join(process.env.XDG_STATE_HOME, 'infinite-world', 'state.json');
  }
  return join(homedir(), '.infinite-world', 'state.json');
}
