import { useEffect, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import type {
  GenerationSettings,
  ProviderSettings,
  WorldConfig,
} from '@infinite-world/api-contract';
import {
  DEFAULT_VIDEO_MODEL,
  DEFAULT_VISION_MODEL,
  isFalVideoModel,
  isGoogleVisionModel,
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
import {
  generationModelOptionsFor,
  modelRequiresInitialImage,
  visionModelOptionsFor,
  WorldSetupForm,
} from '../world/world-setup-form';
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
      const defaultVisionModel = providerSettings.googleApiKeyConfigured
        ? DEFAULT_VISION_MODEL
        : 'none';
      const hostedDefaults = defaultModel === 'fal-ai/ltx-2.3/image-to-video/fast';
      setConfig({
        ...defaultWorldConfig,
        generation: {
          ...defaultWorldConfig.generation,
          visionModel: defaultVisionModel,
          model: defaultModel,
          ...(hostedDefaults
            ? {
                durationSeconds: 6,
                frameRate: 24,
                resolution: '1080p' as const,
                aspectRatio: '16:9' as const,
              }
            : {}),
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

  const providerReady =
    !isFalVideoModel(config.generation.model) || providerSettings.falApiKeyConfigured;
  const visionProviderReady =
    !isGoogleVisionModel(config.generation.visionModel) || providerSettings.googleApiKeyConfigured;
  const initialImageReady =
    !modelRequiresInitialImage(config.generation.model) ||
    Boolean(config.generation.initialImageUrl?.trim());

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
            visionModelOptions={visionModelOptionsFor(providerSettings.googleApiKeyConfigured)}
            videoModelOptions={generationModelOptionsFor(providerSettings.falApiKeyConfigured)}
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
              disabled={
                busy ||
                !providerReady ||
                !visionProviderReady ||
                !initialImageReady ||
                !config.name.trim() ||
                !config.prompt.trim()
              }
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
