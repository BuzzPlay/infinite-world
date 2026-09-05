'use client';

import type { ProviderSettings, UpdateProviderSettingsRequest } from '@infinite-world/api-contract';
import type { ModelCapability } from '@infinite-world/api-contract/model-catalog';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { useTranslation } from '../../i18n/use-translation';
import { ModelSettingsForm } from './model-settings-form';

interface ModelSettingsDialogProps {
  open: boolean;
  defaultCapability: ModelCapability;
  settings: ProviderSettings;
  loading: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: UpdateProviderSettingsRequest) => Promise<void>;
}

export function ModelSettingsDialog({
  open,
  defaultCapability,
  settings,
  loading,
  busy,
  onOpenChange,
  onSave,
}: ModelSettingsDialogProps) {
  const { t } = useTranslation('settings');

  const savePartial = (patch: Partial<UpdateProviderSettingsRequest>) =>
    onSave({
      defaultStylePreset: settings.defaultStylePreset,
      twitchChannel: settings.twitchChannel,
      twitchUsername: settings.twitchUsername,
      chatLookback: settings.chatLookback,
      ...patch,
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[min(82dvh,760px)] max-w-[calc(100%-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-6 overflow-hidden p-5 sm:max-w-4xl sm:p-7">
        <DialogHeader className="pr-10">
          <DialogTitle>{t('modelDialogTitle')}</DialogTitle>
          <DialogDescription>{t('modelDialogDescription')}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto pr-1">
          <ModelSettingsForm
            key={`${defaultCapability}-${open}`}
            settings={settings}
            loading={loading}
            busy={busy}
            defaultCapability={defaultCapability}
            onSave={savePartial}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
