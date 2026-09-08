import type { ProviderSettings } from '@infinite-world/api-contract';

import type { ProviderState } from '../types.js';

export function providerResponse(settings: ProviderState): ProviderSettings {
  return {
    falApiKeyConfigured: Boolean(settings.falApiKey),
    googleApiKeyConfigured: Boolean(settings.googleApiKey),
    openaiApiKeyConfigured: Boolean(settings.openaiApiKey),
    openaiBaseUrl: settings.openaiBaseUrl,
    defaultStylePreset: settings.defaultStylePreset,
    twitchChannel: settings.twitchChannel,
    twitchUsername: settings.twitchUsername,
    chatLookback: settings.chatLookback,
    twitchStreamKeyConfigured: Boolean(settings.twitchStreamKey),
    twitchOauthTokenConfigured: Boolean(settings.twitchOauthToken),
  };
}
