import type { ProviderSettings, UpdateProviderSettingsRequest } from '@infinite-world/api-contract';
import { GearIcon, RobotIcon } from '@phosphor-icons/react';
import { useTranslation } from '../../i18n/use-translation';
import { SettingsSectionHeader } from '../ui/settings-section-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { GeneralSettings } from './general-settings';
import { ModelSettingsForm } from './model-settings-form';

interface ProviderSettingsPageProps {
  settings: ProviderSettings;
  loading: boolean;
  busy: boolean;
  defaultTab?: SettingsTab;
  onSave: (settings: UpdateProviderSettingsRequest) => Promise<void>;
}

export type SettingsTab = 'general' | 'model';

export function ProviderSettingsPage({
  settings,
  loading,
  busy,
  defaultTab = 'general',
  onSave,
}: ProviderSettingsPageProps) {
  const { t } = useTranslation('settings');

  const savePartial = async (patch: Partial<UpdateProviderSettingsRequest>) => {
    await onSave({
      defaultStylePreset: settings.defaultStylePreset,
      twitchChannel: settings.twitchChannel,
      twitchUsername: settings.twitchUsername,
      chatLookback: settings.chatLookback,
      ...patch,
    });
  };

  return (
    <Tabs
      defaultValue={defaultTab}
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

const settingsTabs = [
  { value: 'general', key: 'generalTitle', icon: GearIcon },
  { value: 'model', key: 'modelTitle', icon: RobotIcon },
] as const;
