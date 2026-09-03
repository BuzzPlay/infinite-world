import { generationModels, stylePresets, validateTemperature } from '../domain/generation.js';
import { providerResponse } from '../domain/provider.js';
import type { RuntimeState } from '../runtime/state.js';
import type { ProviderState } from '../types.js';

export class SettingsService {
  constructor(private readonly state: RuntimeState) {}

  providers() {
    return providerResponse(this.state.provider);
  }

  update(input: Record<string, unknown>) {
    const next = input;
    setSecret(this.state.provider, 'falApiKey', next.falApiKey);
    setSecret(this.state.provider, 'twitchStreamKey', next.twitchStreamKey);
    setSecret(this.state.provider, 'twitchOauthToken', next.twitchOauthToken);
    setSecret(this.state.provider, 'openaiApiKey', next.openaiApiKey);
    setSecret(this.state.provider, 'groqApiKey', next.groqApiKey);
    if (typeof next.defaultModel === 'string' && generationModels.has(next.defaultModel))
      this.state.provider.defaultModel = next.defaultModel;
    if (typeof next.llmTextModel === 'string')
      this.state.provider.llmTextModel = next.llmTextModel.trim();
    if (typeof next.llmVisionModel === 'string')
      this.state.provider.llmVisionModel = next.llmVisionModel.trim();
    if (typeof next.llmTemperature === 'number') validateTemperature(next.llmTemperature);
    if (typeof next.llmTemperature === 'number')
      this.state.provider.llmTemperature = next.llmTemperature;
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
    'falApiKey' | 'twitchStreamKey' | 'twitchOauthToken' | 'openaiApiKey' | 'groqApiKey'
  >,
  value: unknown,
) {
  if (typeof value !== 'string') return;
  const normalized = value.trim();
  if (normalized) settings[key] = normalized;
}
