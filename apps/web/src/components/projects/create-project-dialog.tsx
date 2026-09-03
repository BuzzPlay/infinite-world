import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound, Plus } from 'lucide-react';
import type {
  GenerationSettings,
  ProviderSettings,
  WorldConfig,
} from '@infinite-world/api-contract';

import { Button } from '../ui/button';
import { InfoBanner } from '../ui/info-banner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { modelRequiresInitialImage, WorldSetupForm } from '../world/world-setup-form';
import { defaultWorldConfig, stylePresetChanges } from '../world/world-defaults';

export interface CreateProjectInput {
  config: WorldConfig;
}

interface CreateProjectDialogProps {
  open: boolean;
  busy: boolean;
  providerSettings: ProviderSettings;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: CreateProjectInput) => Promise<void>;
  onOpenSettings: () => void;
}

export function CreateProjectDialog({
  open,
  busy,
  providerSettings,
  onOpenChange,
  onCreate,
  onOpenSettings,
}: CreateProjectDialogProps) {
  const [config, setConfig] = useState<WorldConfig>(defaultWorldConfig);

  useEffect(() => {
    if (open) {
      const isHosted =
        providerSettings.defaultModel === 'fal-ltx-video' ||
        providerSettings.defaultModel === 'fal-ltx-2.3' ||
        providerSettings.defaultModel === 'ltx-2.3';
      const defaultModel =
        providerSettings.falApiKeyConfigured || !isHosted
          ? providerSettings.defaultModel
          : defaultWorldConfig.generation.model;
      const hostedDefaults = ['fal-ltx-2.3', 'ltx-2.3'].includes(defaultModel);
      setConfig({
        ...defaultWorldConfig,
        generation: {
          ...defaultWorldConfig.generation,
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
    providerSettings.defaultModel,
    providerSettings.defaultStylePreset,
    providerSettings.falApiKeyConfigured,
  ]);

  const updateGeneration = (changes: Partial<GenerationSettings>) => {
    setConfig((current) => ({ ...current, generation: { ...current.generation, ...changes } }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCreate({ config });
  };

  const providerReady =
    !['fal-ltx-video', 'fal-ltx-2.3', 'ltx-2.3'].includes(config.generation.model) ||
    providerSettings.falApiKeyConfigured;
  const initialImageReady =
    !modelRequiresInitialImage(config.generation.model) ||
    Boolean(config.generation.initialImageUrl?.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,760px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>Set the starting conditions for a new world.</DialogDescription>
        </DialogHeader>
        <form className="grid min-w-0" onSubmit={(event) => void submit(event)}>
          <WorldSetupForm
            draft={config}
            onNameChange={(name) => setConfig((current) => ({ ...current, name }))}
            onPromptChange={(prompt) => setConfig((current) => ({ ...current, prompt }))}
            onGenerationChange={updateGeneration}
            className="px-0 py-2 sm:px-0 sm:py-2"
          />
          {['fal-ltx-video', 'fal-ltx-2.3', 'ltx-2.3'].includes(config.generation.model) &&
          !providerSettings.falApiKeyConfigured ? (
            <InfoBanner
              tone="warning"
              icon={KeyRound}
              title="Provider setup required"
              action={
                <Button type="button" size="xs" variant="outline" onClick={onOpenSettings}>
                  Open settings
                </Button>
              }
            >
              Add a provider key in Settings before starting hosted generation.
            </InfoBanner>
          ) : null}
          <DialogFooter className="border-t border-border/70 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={
                busy ||
                !providerReady ||
                !initialImageReady ||
                !config.name.trim() ||
                !config.prompt.trim()
              }
            >
              <Plus size={15} aria-hidden="true" />
              {busy ? 'Creating' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
