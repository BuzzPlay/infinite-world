import { useEffect, useState, type FormEvent } from 'react';
import { Check, Save } from 'lucide-react';
import { BroadcastIcon, GearIcon, RobotIcon } from '@phosphor-icons/react';
import type { ProviderSettings, UpdateProviderSettingsRequest } from '@infinite-world/api-contract';

import { Button } from '../ui/button';
import { FieldDescription } from '../ui/field';
import { SettingsSectionHeader } from '../ui/settings-section-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { GeneralSettings } from './general-settings';
import { LiveSettingsForm } from './live-settings-form';
import { ModelSettingsForm } from './model-settings-form';
import { useTranslation } from '../../i18n/use-translation';

interface ProviderSettingsPageProps {
  settings: ProviderSettings;
  loading: boolean;
  busy: boolean;
  onSave: (settings: UpdateProviderSettingsRequest) => Promise<void>;
}

export function ProviderSettingsPage({
  settings,
  loading,
  busy,
  onSave,
}: ProviderSettingsPageProps) {
  const { t } = useTranslation('settings');
  const [twitchChannel, setTwitchChannel] = useState(settings.twitchChannel);
  const [twitchUsername, setTwitchUsername] = useState(settings.twitchUsername);
  const [chatLookback, setChatLookback] = useState(settings.chatLookback);
  const [twitchStreamKey, setTwitchStreamKey] = useState('');
  const [twitchOauthToken, setTwitchOauthToken] = useState('');
  const [clearTwitchStreamKey, setClearTwitchStreamKey] = useState(false);
  const [clearTwitchOauthToken, setClearTwitchOauthToken] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTwitchChannel(settings.twitchChannel);
    setTwitchUsername(settings.twitchUsername);
    setChatLookback(settings.chatLookback);
    setClearTwitchStreamKey(false);
    setClearTwitchOauthToken(false);
  }, [settings]);

  const savePartial = async (patch: Partial<UpdateProviderSettingsRequest>) => {
    setSaved(false);
    setError(null);
    await onSave({
      defaultStylePreset: settings.defaultStylePreset,
      twitchChannel,
      twitchUsername,
      chatLookback,
      ...patch,
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(false);
    setError(null);
    try {
      await onSave({
        defaultStylePreset: settings.defaultStylePreset,
        twitchChannel,
        twitchUsername,
        chatLookback,
        ...(twitchStreamKey.trim()
          ? { twitchStreamKey: twitchStreamKey.trim() }
          : clearTwitchStreamKey
            ? { twitchStreamKey: '' }
            : {}),
        ...(twitchOauthToken.trim()
          ? { twitchOauthToken: twitchOauthToken.trim() }
          : clearTwitchOauthToken
            ? { twitchOauthToken: '' }
            : {}),
      });
      setTwitchStreamKey('');
      setTwitchOauthToken('');
      setClearTwitchStreamKey(false);
      setClearTwitchOauthToken(false);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('saveFailed'));
    }
  };

  return (
    <Tabs
      defaultValue="general"
      className="flex min-h-full min-w-0 flex-1 flex-col gap-0 bg-background sm:grid sm:grid-cols-[230px_1fr] sm:border-l sm:border-border"
    >
      <aside className="hidden min-h-0 flex-col overflow-y-auto border-r border-border bg-background py-4 sm:flex">
        <div className="min-h-0 flex-1 px-2.5">
          <TabsList
            orientation="vertical"
            animate="none"
            className="w-full gap-0.5"
            aria-label={t('sections')}
          >
            <SettingsTabItems />
          </TabsList>
        </div>
      </aside>
      <main className="bg-background flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-4 py-2 sm:hidden">
          <TabsList type="underline" animate="none" size="sm" className="w-full">
            <SettingsTabItems />
          </TabsList>
        </div>

        <TabsContent value="general" className="min-h-full">
          <div className="mx-auto flex min-h-0 w-full flex-1 flex-col space-y-6 overflow-y-auto px-4 py-10 pb-20 lg:py-14">
            <div className="mx-auto w-full max-w-2xl space-y-8">
              <SettingsSectionHeader title={t('generalTitle')} className="pb-1" />
              <GeneralSettings />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="model" className="min-h-full">
          <div className="mx-auto flex min-h-0 w-full flex-1 flex-col space-y-6 overflow-y-auto px-4 py-10 pb-20 lg:py-14">
            <div className="mx-auto w-full max-w-2xl space-y-8">
              <SettingsSectionHeader title={t('modelTitle')} className="pb-1" />
              <div className="grid gap-4">
                <ModelSettingsForm
                  settings={settings}
                  loading={loading}
                  busy={busy}
                  onSave={savePartial}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="live" className="min-h-full">
          <div className="mx-auto flex min-h-0 w-full flex-1 flex-col space-y-6 overflow-y-auto px-4 py-10 pb-20 lg:py-14">
            <div className="mx-auto w-full max-w-2xl space-y-8">
              <SettingsSectionHeader title={t('liveTitle')} className="pb-1" />
              <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
                <LiveSettingsForm
                  settings={settings}
                  twitchChannel={twitchChannel}
                  onTwitchChannelChange={setTwitchChannel}
                  twitchUsername={twitchUsername}
                  onTwitchUsernameChange={setTwitchUsername}
                  chatLookback={chatLookback}
                  onChatLookbackChange={setChatLookback}
                  twitchStreamKey={twitchStreamKey}
                  onTwitchStreamKeyChange={(value) => {
                    setTwitchStreamKey(value);
                    setClearTwitchStreamKey(false);
                  }}
                  onClearTwitchStreamKey={() => {
                    setTwitchStreamKey('');
                    setClearTwitchStreamKey(true);
                  }}
                  twitchOauthToken={twitchOauthToken}
                  onTwitchOauthTokenChange={(value) => {
                    setTwitchOauthToken(value);
                    setClearTwitchOauthToken(false);
                  }}
                  onClearTwitchOauthToken={() => {
                    setTwitchOauthToken('');
                    setClearTwitchOauthToken(true);
                  }}
                />
                <SettingsSaveBar loading={loading} busy={busy} saved={saved} error={error} />
              </form>
            </div>
          </div>
        </TabsContent>
      </main>
    </Tabs>
  );
}

function SettingsTabItems() {
  const { t } = useTranslation('settings');
  return settingsTabs.map(({ value, key, icon: Icon }) => (
    <TabsTrigger
      key={value}
      value={value}
      className="h-8 w-full justify-start gap-2.5 rounded-sm px-2.5 text-sm data-[state=active]:bg-primary/[0.06] data-[state=active]:text-foreground data-[state=active]:font-medium data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:bg-accent hover:data-[state=inactive]:text-foreground"
    >
      <Icon className="size-4" aria-hidden="true" />
      {t(key)}
    </TabsTrigger>
  ));
}

function SettingsSaveBar({
  loading,
  busy,
  saved,
  error,
}: {
  loading: boolean;
  busy: boolean;
  saved: boolean;
  error: string | null;
}) {
  const { t } = useTranslation('settings');

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-1 py-3">
      <div className="min-w-0">
        {error ? <FieldDescription className="text-destructive">{error}</FieldDescription> : null}
        {saved ? (
          <FieldDescription className="flex items-center gap-1 text-brand-green">
            <Check className="size-3.5" aria-hidden="true" /> {t('saved')}
          </FieldDescription>
        ) : null}
      </div>
      <Button type="submit" size="sm" variant="default" disabled={loading || busy}>
        <Save className="size-4" aria-hidden="true" />
        {busy ? t('saving') : t('saveSettings')}
      </Button>
    </div>
  );
}

const settingsTabs = [
  { value: 'general', key: 'generalTitle', icon: GearIcon },
  { value: 'model', key: 'modelTitle', icon: RobotIcon },
  { value: 'live', key: 'liveTitle', icon: BroadcastIcon },
] as const;
