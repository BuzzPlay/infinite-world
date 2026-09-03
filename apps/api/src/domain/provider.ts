import type { ProviderSettings } from '@infinite-world/api-contract';

import type { ProviderState } from '../types.js';

export function providerResponse(settings: ProviderState): ProviderSettings {
  return {
    falApiKeyConfigured: Boolean(settings.falApiKey),
    defaultModel: settings.defaultModel,
    llmTextModel: settings.llmTextModel,
    llmVisionModel: settings.llmVisionModel,
    llmTemperature: settings.llmTemperature,
    defaultStylePreset: settings.defaultStylePreset,
    twitchChannel: settings.twitchChannel,
    twitchUsername: settings.twitchUsername,
    chatLookback: settings.chatLookback,
    twitchStreamKeyConfigured: Boolean(settings.twitchStreamKey),
    twitchOauthTokenConfigured: Boolean(settings.twitchOauthToken),
    openaiApiKeyConfigured: Boolean(settings.openaiApiKey),
    groqApiKeyConfigured: Boolean(settings.groqApiKey),
  };
}
