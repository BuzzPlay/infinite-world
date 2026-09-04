import { Trash2 } from 'lucide-react';

import type { ProviderSettings } from '@infinite-world/api-contract';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SectionCard } from '../ui/section-card';
import { SettingsRow, SettingsRowGroup } from '../ui/settings-row';
import { useTranslation } from '../../i18n/use-translation';

interface LiveSettingsFormProps {
  settings: ProviderSettings;
  twitchChannel: string;
  onTwitchChannelChange: (value: string) => void;
  twitchUsername: string;
  onTwitchUsernameChange: (value: string) => void;
  chatLookback: number;
  onChatLookbackChange: (value: number) => void;
  twitchStreamKey: string;
  onTwitchStreamKeyChange: (value: string) => void;
  onClearTwitchStreamKey: () => void;
  twitchOauthToken: string;
  onTwitchOauthTokenChange: (value: string) => void;
  onClearTwitchOauthToken: () => void;
}

export function LiveSettingsForm({
  settings,
  twitchChannel,
  onTwitchChannelChange,
  twitchUsername,
  onTwitchUsernameChange,
  chatLookback,
  onChatLookbackChange,
  twitchStreamKey,
  onTwitchStreamKeyChange,
  onClearTwitchStreamKey,
  twitchOauthToken,
  onTwitchOauthTokenChange,
  onClearTwitchOauthToken,
}: LiveSettingsFormProps) {
  const { t } = useTranslation('settings');

  return (
    <SectionCard title={t('liveAndChat')} description={t('liveAndChatDescription')} flush>
      <SettingsRowGroup className="rounded-none border-x-0 border-b-0">
        <SettingsRow
          label={t('chatChannel')}
          description={
            settings.twitchOauthTokenConfigured
              ? t('messagesInfluenceNext')
              : t('optionalTwitchChannel')
          }
          htmlFor="twitch-channel"
        >
          <Input
            id="twitch-channel"
            className="w-56"
            value={twitchChannel}
            onChange={(event) => onTwitchChannelChange(event.target.value)}
            placeholder={t('channelName')}
          />
        </SettingsRow>
        <SettingsRow
          label={t('chatUsername')}
          description={t('authenticatedChatOnly')}
          htmlFor="twitch-username"
        >
          <Input
            id="twitch-username"
            className="w-56"
            value={twitchUsername}
            onChange={(event) => onTwitchUsernameChange(event.target.value)}
            placeholder={t('botUsername')}
          />
        </SettingsRow>
        <SettingsRow
          label={t('chatMessages')}
          description={t('messagesForNextScene')}
          htmlFor="chat-lookback"
        >
          <Input
            id="chat-lookback"
            className="w-20 px-2 text-right tabular-nums"
            type="number"
            min="1"
            max="100"
            step="1"
            value={chatLookback}
            onChange={(event) => onChatLookbackChange(Number(event.target.value))}
          />
        </SettingsRow>
        <SettingsRow
          label={t('twitchStreamKey')}
          description={
            settings.twitchStreamKeyConfigured ? t('savedLocallyKeep') : t('twitchKeyWhenLive')
          }
          htmlFor="twitch-stream-key"
        >
          <SecretInput
            id="twitch-stream-key"
            value={twitchStreamKey}
            configured={settings.twitchStreamKeyConfigured}
            onChange={onTwitchStreamKeyChange}
            onClear={onClearTwitchStreamKey}
            placeholder={t('pasteStreamKey')}
            clearLabel={t('clearTwitchStreamKey')}
          />
        </SettingsRow>
        <SettingsRow
          label={t('chatToken')}
          description={
            settings.twitchOauthTokenConfigured ? t('savedLocallyKeep') : t('optionalOauth')
          }
          htmlFor="twitch-token"
        >
          <SecretInput
            id="twitch-token"
            value={twitchOauthToken}
            configured={settings.twitchOauthTokenConfigured}
            onChange={onTwitchOauthTokenChange}
            onClear={onClearTwitchOauthToken}
            placeholder={t('oauthToken')}
            clearLabel={t('clearTwitchChatToken')}
          />
        </SettingsRow>
      </SettingsRowGroup>
    </SectionCard>
  );
}

function SecretInput({
  id,
  value,
  configured,
  onChange,
  onClear,
  placeholder,
  clearLabel,
}: {
  id: string;
  value: string;
  configured: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder: string;
  clearLabel: string;
}) {
  const { t } = useTranslation('settings');

  return (
    <div className="flex w-56 items-center gap-2">
      <Input
        id={id}
        className="min-w-0 flex-1"
        type="password"
        autoComplete="new-password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={configured ? t('savedValue') : placeholder}
      />
      {configured || value ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          title={clearLabel}
          aria-label={clearLabel}
          onClick={onClear}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
