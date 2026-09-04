import { useEffect, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import type {
  GenerationSettings,
  ProviderSettings,
  WorldConfig,
} from '@infinite-world/api-contract';
import {
  DEFAULT_VIDEO_MODEL,
  defaultVisionModelFor,
} from '@infinite-world/api-contract/model-catalog';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { WorldSetupForm } from '../world/world-setup-form';
import { videoModelChanges } from '../world/model-options';
import { defaultWorldConfig, stylePresetChanges } from '../world/world-defaults';
import { useTranslation } from '../../i18n/use-translation';

export interface CreateProjectInput {
  config: WorldConfig;
}

interface CreateProjectDialogProps {
  open: boolean;
  busy: boolean;
  providerSettings: ProviderSettings;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: CreateProjectInput) => Promise<void>;
}

export function CreateProjectDialog({
  open,
  busy,
  providerSettings,
  onOpenChange,
  onCreate,
}: CreateProjectDialogProps) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<WorldConfig>(defaultWorldConfig);

  useEffect(() => {
    if (open) {
      const defaultModel: string = providerSettings.falApiKeyConfigured
        ? DEFAULT_VIDEO_MODEL
        : 'none';
      const defaultVisionModel = defaultVisionModelFor(
        providerSettings.googleApiKeyConfigured,
        providerSettings.falApiKeyConfigured,
      );
      setConfig({
        ...defaultWorldConfig,
        generation: {
          ...defaultWorldConfig.generation,
          visionModel: defaultVisionModel,
          ...videoModelChanges(defaultWorldConfig.generation, defaultModel),
          stylePreset: providerSettings.defaultStylePreset,
          ...stylePresetChanges(providerSettings.defaultStylePreset),
        },
      });
    }
  }, [
    open,
    providerSettings.defaultStylePreset,
    providerSettings.falApiKeyConfigured,
    providerSettings.googleApiKeyConfigured,
  ]);

  const updateGeneration = (changes: Partial<GenerationSettings>) => {
    setConfig((current) => ({ ...current, generation: { ...current.generation, ...changes } }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCreate({ config });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,760px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('project.createTitle')}</DialogTitle>
          <DialogDescription>{t('project.createDescription')}</DialogDescription>
        </DialogHeader>
        <form className="grid min-w-0" onSubmit={(event) => void submit(event)}>
          <WorldSetupForm
            draft={config}
            onNameChange={(name) => setConfig((current) => ({ ...current, name }))}
            onPromptChange={(prompt) => setConfig((current) => ({ ...current, prompt }))}
            onGenerationChange={updateGeneration}
            className="px-0 py-2 sm:px-0 sm:py-2"
          />
          <DialogFooter className="border-t border-border/70 pt-4">
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
              disabled={busy || !config.name.trim() || !config.prompt.trim()}
            >
              <Plus size={15} aria-hidden="true" />
              {busy ? t('project.creating') : t('project.createProject')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
