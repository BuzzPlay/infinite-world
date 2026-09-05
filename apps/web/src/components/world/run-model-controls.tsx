import type { GenerationSettings } from '@infinite-world/api-contract';
import { type ModelCapability, videoProfileFor } from '@infinite-world/api-contract/model-catalog';
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '../../i18n/use-translation';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  type GenerationModelOption,
  videoDurationChanges,
  videoModelChanges,
} from './model-options';
import { ModelSelector } from './model-selector';

interface RunModelControlsProps {
  generation: GenerationSettings;
  visionModelOptions: GenerationModelOption[];
  videoModelOptions: GenerationModelOption[];
  disabled: boolean;
  onInteraction: () => void;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
  onOpenRunSettings: () => void;
  onOpenModelSettings: (capability: ModelCapability) => void;
}

export function RunModelControls({
  generation,
  visionModelOptions,
  videoModelOptions,
  disabled,
  onInteraction,
  onGenerationChange,
  onOpenRunSettings,
  onOpenModelSettings,
}: RunModelControlsProps) {
  const { t } = useTranslation();
  const [openSelector, setOpenSelector] = useState<ModelCapability | null>(null);
  const visionModel = availableValue(generation.visionModel, visionModelOptions);
  const videoModel = availableValue(generation.model, videoModelOptions);

  return (
    <fieldset className="grid w-full max-w-2xl grid-cols-[repeat(3,minmax(0,1fr))_auto] items-center gap-1 rounded-xl border border-border bg-background/95 p-1 backdrop-blur-md">
      <legend className="sr-only">{t('dashboard.runModels')}</legend>
      <ModelSelector
        label={t('settings.vision')}
        value={visionModel}
        options={visionModelOptions}
        disabled={disabled}
        open={openSelector === 'vision'}
        onOpenChange={(open) => {
          if (open) onInteraction();
          setOpenSelector(open ? 'vision' : null);
        }}
        onValueChange={(visionModel) => {
          onInteraction();
          onGenerationChange({ visionModel });
        }}
        onConnectProvider={() => {
          onInteraction();
          onOpenModelSettings('vision');
        }}
        onManageModels={() => {
          onInteraction();
          onOpenModelSettings('vision');
        }}
      />
      <ModelSelector
        label={t('settings.video')}
        value={videoModel}
        options={videoModelOptions}
        disabled={disabled}
        open={openSelector === 'video'}
        onOpenChange={(open) => {
          if (open) onInteraction();
          setOpenSelector(open ? 'video' : null);
        }}
        onValueChange={(model) => {
          onInteraction();
          onGenerationChange(videoModelChanges(generation, model));
        }}
        onConnectProvider={() => {
          onInteraction();
          onOpenModelSettings('video');
        }}
        onManageModels={() => {
          onInteraction();
          onOpenModelSettings('video');
        }}
      />
      <DurationSelector
        generation={generation}
        disabled={disabled}
        onInteraction={onInteraction}
        onGenerationChange={onGenerationChange}
      />
      <Button
        type="button"
        size="icon-md"
        variant="ghost"
        title={t('dashboard.openGenerationSettings')}
        aria-label={t('dashboard.openGenerationSettings')}
        onClick={() => {
          onInteraction();
          setOpenSelector(null);
          onOpenRunSettings();
        }}
        disabled={disabled}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
      </Button>
    </fieldset>
  );
}

function DurationSelector({
  generation,
  disabled,
  onInteraction,
  onGenerationChange,
}: {
  generation: GenerationSettings;
  disabled: boolean;
  onInteraction: () => void;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
}) {
  const { t } = useTranslation();
  const profile = videoProfileFor(generation.model);
  const duration = profile?.durations.includes(generation.durationSeconds)
    ? generation.durationSeconds
    : profile?.defaults.durationSeconds;

  return (
    <div className="min-w-0">
      <span className="block px-2.5 pb-0.5 pt-1 text-[11px] font-medium leading-none text-muted-foreground">
        {t('project.duration')}
      </span>
      <Select
        value={duration === undefined ? undefined : String(duration)}
        onValueChange={(value) => {
          const changes = videoDurationChanges(generation, Number(value));
          if (Object.keys(changes).length) {
            onInteraction();
            onGenerationChange(changes);
          }
        }}
        disabled={disabled || !profile}
      >
        <SelectTrigger
          variant="transparent"
          size="sm"
          className="h-8 w-full min-w-0 rounded-lg px-2.5 text-xs text-foreground/70 hover:text-foreground"
          aria-label={t('project.duration')}
        >
          <SelectValue placeholder={t('dashboard.noModel')} />
        </SelectTrigger>
        <SelectContent>
          {profile?.durations.map((durationOption) => (
            <SelectItem key={durationOption} value={String(durationOption)}>
              {durationOption} {t('project.seconds')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function availableValue(value: string, options: GenerationModelOption[]) {
  return options.some((option) => option.value === value) ? value : 'none';
}
