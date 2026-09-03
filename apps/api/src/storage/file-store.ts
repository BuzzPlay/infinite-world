import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { config } from '../config.js';
import type { PersistedState, ProviderState, StoredRun } from '../types.js';

const EMPTY_STATE: PersistedState = { worlds: [], activeWorldId: null, runs: [], provider: {} };

export function loadState(): PersistedState {
  try {
    const parsed = JSON.parse(readFileSync(config.dataFile, 'utf8')) as Partial<PersistedState>;
    return {
      worlds: Array.isArray(parsed.worlds) ? parsed.worlds : [],
      activeWorldId: typeof parsed.activeWorldId === 'string' ? parsed.activeWorldId : null,
      runs: Array.isArray(parsed.runs) ? (parsed.runs as StoredRun[]) : [],
      provider: parsed.provider && typeof parsed.provider === 'object' ? parsed.provider : {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(`Could not read ${config.dataFile}; starting with empty state.`, error);
    }
    return { ...EMPTY_STATE, provider: {} };
  }
}

export function saveState(state: PersistedState) {
  mkdirSync(dirname(config.dataFile), { recursive: true });
  const temporary = `${config.dataFile}.tmp`;
  writeFileSync(temporary, JSON.stringify(state, null, 2), { encoding: 'utf8', mode: 0o600 });
  try {
    chmodSync(temporary, 0o600);
  } catch {
    // File permissions are best effort on platforms without POSIX modes.
  }
  renameSync(temporary, config.dataFile);
}

export function defaultProviderState(): ProviderState {
  return {
    falApiKey: nonEmpty(process.env.FAL_API_KEY) ?? nonEmpty(process.env.FAL_KEY),
    openaiApiKey: nonEmpty(process.env.OPENAI_API_KEY),
    groqApiKey: nonEmpty(process.env.GROQ_API_KEY),
    twitchStreamKey: nonEmpty(process.env.TWITCH_STREAM_KEY),
    twitchOauthToken: nonEmpty(process.env.TWITCH_OAUTH_TOKEN),
    defaultModel: 'demo-continuous',
    llmTextModel: 'google/gemini-2.5-flash',
    llmVisionModel: 'google/gemini-2.5-flash',
    llmTemperature: 0.7,
    defaultStylePreset: 'cohesive',
    twitchChannel: process.env.TWITCH_CHANNEL?.trim() ?? '',
    twitchUsername: process.env.TWITCH_USERNAME?.trim() ?? '',
    chatLookback: 5,
  };
}

function nonEmpty(value: string | undefined | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
