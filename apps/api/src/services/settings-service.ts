import { stylePresets } from '../domain/generation.js';
import { providerResponse } from '../domain/provider.js';
import type { RuntimeState } from '../runtime/state.js';
import { ApiError } from '../shared/errors.js';
import type { ProviderState } from '../types.js';

export const OPENAI_DEFAULT_BASE_URL = 'https://api.openai.com/v1';

export class SettingsService {
  constructor(private readonly state: RuntimeState) {}

  providers() {
    return providerResponse(this.state.provider);
  }

  update(input: Record<string, unknown>) {
    const next = input;
    setSecret(this.state.provider, 'falApiKey', next.falApiKey);
    setSecret(this.state.provider, 'googleApiKey', next.googleApiKey);
    setSecret(this.state.provider, 'openaiApiKey', next.openaiApiKey);
    setSecret(this.state.provider, 'twitchStreamKey', next.twitchStreamKey);
    setSecret(this.state.provider, 'twitchOauthToken', next.twitchOauthToken);
    if (typeof next.openaiBaseUrl === 'string') {
      this.state.provider.openaiBaseUrl = normalizeOpenAIBaseUrl(next.openaiBaseUrl);
    }
    if (typeof next.defaultStylePreset === 'string' && stylePresets.has(next.defaultStylePreset)) {
      this.state.provider.defaultStylePreset =
        next.defaultStylePreset as ProviderState['defaultStylePreset'];
    }
    if (typeof next.twitchChannel === 'string')
      this.state.provider.twitchChannel = next.twitchChannel.trim();
    if (typeof next.twitchUsername === 'string')
      this.state.provider.twitchUsername = next.twitchUsername.trim();
    if (typeof next.chatLookback === 'number')
      this.state.provider.chatLookback = Math.min(100, Math.max(1, Math.round(next.chatLookback)));
    this.state.persist();
    return this.providers();
  }
}

function setSecret(
  settings: ProviderState,
  key: keyof Pick<
    ProviderState,
    'falApiKey' | 'googleApiKey' | 'openaiApiKey' | 'twitchStreamKey' | 'twitchOauthToken'
  >,
  value: unknown,
) {
  if (typeof value !== 'string') return;
  const normalized = value.trim();
  settings[key] = normalized || null;
}

function normalizeOpenAIBaseUrl(value: string) {
  const normalized = value.trim() || OPENAI_DEFAULT_BASE_URL;
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new ApiError(400, 'invalid_openai_base_url', 'OpenAI-compatible Base URL is invalid');
  }
  const localHost =
    url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && localHost)) {
    throw new ApiError(
      400,
      'invalid_openai_base_url',
      'OpenAI-compatible Base URL must use HTTPS, except for localhost',
    );
  }
  return url.toString().replace(/\/$/, '');
}
