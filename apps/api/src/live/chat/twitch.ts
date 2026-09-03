import tmi from 'tmi.js';

import type { ProviderState } from '../../types.js';

export interface ChatMessage {
  username: string;
  message: string;
  receivedAt: string;
}

export class TwitchChat {
  private client: ReturnType<typeof tmi.Client> | null = null;
  private readonly messages: ChatMessage[] = [];

  async connect(settings: ProviderState) {
    if (!settings.twitchChannel) return;
    await this.disconnect();
    const identity =
      settings.twitchUsername && settings.twitchOauthToken
        ? { username: settings.twitchUsername, password: settings.twitchOauthToken }
        : undefined;
    const client = tmi.Client({ channels: [settings.twitchChannel], identity });
    client.on(
      'message',
      (
        _channel: string,
        tags: Record<string, string | undefined>,
        message: string,
        self: boolean,
      ) => {
        if (self) return;
        this.messages.push({
          username: tags['display-name'] ?? tags.username ?? 'viewer',
          message,
          receivedAt: new Date().toISOString(),
        });
        while (this.messages.length > 100) this.messages.shift();
      },
    );
    await client.connect();
    this.client = client;
  }

  async disconnect() {
    if (!this.client) return;
    const current = this.client;
    this.client = null;
    await current.disconnect().catch(() => undefined);
  }

  recent(limit: number) {
    return this.messages.slice(-limit);
  }
}
