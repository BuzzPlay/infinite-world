import { useState, type FormEvent } from 'react';
import type { WorldConfig } from '@infinite-world/api-contract';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useTranslation } from '../../i18n/use-translation';
import { GenerationSettingsForm } from './generation-settings-form';

interface RunSettingsDialogProps {
  open: boolean;
  draft: WorldConfig;
  busy: boolean;
  running: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: WorldConfig) => Promise<boolean>;
}

export function RunSettingsDialog({
  open,
  draft,
  busy,
  running,
  onOpenChange,
  onSave,
}: RunSettingsDialogProps) {
  const { t } = useTranslation();
  const { t: settingsT } = useTranslation('settings');
  const [config, setConfig] = useState<WorldConfig>(() => copyConfig(draft));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await onSave(config)) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,760px)] overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>{t('dashboard.generationSettings')}</DialogTitle>
          <DialogDescription>{t('dashboard.nextRunConfiguration')}</DialogDescription>
        </DialogHeader>
        <form className="grid min-w-0" onSubmit={(event) => void submit(event)}>
          <fieldset disabled={busy || running}>
            <GenerationSettingsForm
              draft={config}
              onPromptChange={(prompt) => setConfig((current) => ({ ...current, prompt }))}
              onGenerationChange={(changes) =>
                setConfig((current) => ({
                  ...current,
                  generation: { ...current.generation, ...changes },
                }))
              }
            />
          </fieldset>
          <DialogFooter className="border-t border-border/70 px-5 pb-5 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={busy || running || !config.prompt.trim()}
            >
              {busy ? settingsT('saving') : t('dashboard.saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function copyConfig(config: WorldConfig): WorldConfig {
  return {
    ...config,
    generation: {
      ...config.generation,
      timesteps: [...config.generation.timesteps],
      spatioTemporalGuidanceBlocks: config.generation.spatioTemporalGuidanceBlocks
        ? [...config.generation.spatioTemporalGuidanceBlocks]
        : null,
      characterRefs: config.generation.characterRefs.map((reference) => ({ ...reference })),
    },
  };
}
