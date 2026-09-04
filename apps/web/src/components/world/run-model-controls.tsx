import type { GenerationSettings } from '@infinite-world/api-contract';
import { SlidersHorizontal } from 'lucide-react';

import { useTranslation } from '../../i18n/use-translation';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { videoModelChanges, type GenerationModelOption } from './model-options';

interface RunModelControlsProps {
  generation: GenerationSettings;
  visionModelOptions: GenerationModelOption[];
  videoModelOptions: GenerationModelOption[];
  disabled: boolean;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
  onOpenSettings: () => void;
}

export function RunModelControls({
  generation,
  visionModelOptions,
  videoModelOptions,
  disabled,
  onGenerationChange,
  onOpenSettings,
}: RunModelControlsProps) {
  const { t } = useTranslation();
  const visionModel = availableValue(generation.visionModel, visionModelOptions);
  const videoModel = availableValue(generation.model, videoModelOptions);

  return (
    <fieldset className="grid w-full max-w-xl grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-1 rounded-xl border border-border bg-background/95 p-1 backdrop-blur-md">
      <legend className="sr-only">{t('dashboard.runModels')}</legend>
      <ModelSelect
        label={t('settings.vision')}
        value={visionModel}
        options={visionModelOptions}
        disabled={disabled}
        onValueChange={(visionModel) => onGenerationChange({ visionModel })}
      />
      <ModelSelect
        label={t('settings.video')}
        value={videoModel}
        options={videoModelOptions}
        disabled={disabled}
        onValueChange={(model) => onGenerationChange(videoModelChanges(generation, model))}
      />
      <Button
        type="button"
        size="icon-md"
        variant="ghost"
        title={t('dashboard.openGenerationSettings')}
        aria-label={t('dashboard.openGenerationSettings')}
        onClick={onOpenSettings}
        disabled={disabled}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
      </Button>
    </fieldset>
  );
}

function ModelSelect({
  label,
  value,
  options,
  disabled,
  onValueChange,
}: {
  label: string;
  value: string;
  options: GenerationModelOption[];
  disabled: boolean;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <span className="block px-2.5 pb-0.5 pt-1 text-[11px] font-medium leading-none text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          className="w-full min-w-0"
          variant="transparent"
          size="sm"
          aria-label={label}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              <span className="font-mono text-xs">{option.label}</span>
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
