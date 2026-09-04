import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  modelsForCapability,
  type ModelCapability,
} from '@infinite-world/api-contract/model-catalog';
import type { GenerationMode, GenerationSettings, WorldConfig } from '@infinite-world/api-contract';
import { ImagePlus, Upload } from 'lucide-react';

import { Button } from '../ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SettingsRow, SettingsRowGroup } from '../ui/settings-row';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { useTranslation } from '../../i18n/use-translation';

interface WorldSetupFormProps {
  draft: WorldConfig;
  onNameChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
  visionModelOptions?: GenerationModelOption[];
  videoModelOptions?: GenerationModelOption[];
  className?: string;
}

export interface GenerationModelOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function modelOptionsFor(
  capability: ModelCapability,
  configured: boolean,
): GenerationModelOption[] {
  if (!configured) return [{ value: 'none', label: 'none' }];
  const models = modelsForCapability(capability)
    .filter((model) => model.id !== 'none')
    .map((model) => ({ value: model.id, label: model.id }));
  return [{ value: 'none', label: 'none' }, ...models];
}

export const hostedGenerationModelOptions = modelOptionsFor('video', true);
export const generationModelOptions = hostedGenerationModelOptions;

export function generationModelOptionsFor(falApiKeyConfigured: boolean) {
  return modelOptionsFor('video', falApiKeyConfigured);
}

export function visionModelOptionsFor(googleApiKeyConfigured: boolean) {
  return modelOptionsFor('vision', googleApiKeyConfigured);
}

const progressionModes: readonly GenerationMode[] = [
  'regular',
  'nightmare',
  'cohesive',
  'visual',
  'chaotic',
];
const resolutionOptions = [
  ['auto', 'Auto'],
  ['1080p', '1080p'],
  ['1440p', '1440p'],
  ['2160p', '2160p'],
] as const;
const aspectRatioOptions = [
  ['auto', 'Auto'],
  ['16:9', '16:9'],
  ['9:16', '9:16'],
] as const;
const hostedDurations = [6, 8, 10, 12, 14, 16, 18, 20] as const;
function isGenerationMode(value: string): value is GenerationMode {
  return progressionModes.includes(value as GenerationMode);
}

function readImage(
  file: File,
  onReady: (value: string) => void,
  onError: (message: string) => void,
  messages: ImageReadMessages = defaultImageReadMessages,
) {
  if (!file.type.startsWith('image/')) {
    onError(messages.invalid);
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    onError(messages.tooLarge);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') onReady(reader.result);
    else onError(messages.failed);
  };
  reader.onerror = () => onError(messages.failed);
  reader.readAsDataURL(file);
}

type ImageReadMessages = {
  invalid: string;
  tooLarge: string;
  failed: string;
};

const defaultImageReadMessages: ImageReadMessages = {
  invalid: 'Choose an image file.',
  tooLarge: 'Images must be smaller than 10 MB.',
  failed: 'The image could not be read.',
};

export function modelRequiresInitialImage(model: string) {
  return model === 'fal-ai/ltx-2.3/image-to-video/fast';
}

export function WorldSetupForm({
  draft,
  onNameChange,
  onPromptChange,
  onGenerationChange,
  visionModelOptions = modelOptionsFor('vision', true),
  videoModelOptions = generationModelOptions,
  className,
}: WorldSetupFormProps) {
  const { t } = useTranslation();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const generation = draft.generation;
  const isHostedLtxVideo = generation.model === 'fal-ai/ltx-video';
  const isHostedLtx23 = generation.model === 'fal-ai/ltx-2.3/image-to-video/fast';
  const supportsFrameRate = isHostedLtx23;
  const supportsDuration = isHostedLtx23;
  const supportsGuidance = isHostedLtxVideo;
  const supportsSeed = isHostedLtxVideo;
  const supportsNegativePrompt = !isHostedLtx23;
  const supportsTimesteps = isHostedLtxVideo;
  const supportsAudio = isHostedLtx23;
  const requiresInitialImage = modelRequiresInitialImage(generation.model);
  const hostedResolution =
    isHostedLtx23 && generation.durationSeconds > 10 ? '1080p' : (generation.resolution ?? 'auto');
  const selectedVisionModel = visionModelOptions.some(
    (option) => option.value === generation.visionModel,
  )
    ? generation.visionModel
    : 'none';
  const selectedVideoModel = videoModelOptions.some((option) => option.value === generation.model)
    ? generation.model
    : 'none';

  useEffect(() => {
    if (!isHostedLtx23 || generation.durationSeconds <= 10) return;
    const changes: Partial<GenerationSettings> = {};
    if (generation.frameRate !== 25) changes.frameRate = 25;
    if (generation.resolution !== '1080p') changes.resolution = '1080p';
    if (Object.keys(changes).length) onGenerationChange(changes);
  }, [
    generation.durationSeconds,
    generation.frameRate,
    generation.resolution,
    isHostedLtx23,
    onGenerationChange,
  ]);

  const updateNumber = (key: keyof GenerationSettings, event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (Number.isFinite(value)) onGenerationChange({ [key]: value } as Partial<GenerationSettings>);
  };

  const updateInitialImage = (value: string) => {
    setImageError(null);
    onGenerationChange({ initialImageUrl: value || null });
  };
  const selectModel = (model: string) => {
    if (model === 'fal-ai/ltx-2.3/image-to-video/fast') {
      const duration = hostedDurations.includes(
        generation.durationSeconds as (typeof hostedDurations)[number],
      )
        ? generation.durationSeconds
        : 6;
      onGenerationChange({
        model,
        durationSeconds: duration,
        frameRate: duration > 10 ? 25 : generation.frameRate,
        resolution: duration > 10 ? '1080p' : (generation.resolution ?? '1080p'),
        aspectRatio: generation.aspectRatio ?? '16:9',
      });
      return;
    }
    onGenerationChange({ model });
  };

  return (
    <div className={`px-4 py-4 sm:px-5 sm:py-5 ${className ?? ''}`}>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="world-name">{t('project.name')}</FieldLabel>
          <Input
            id="world-name"
            value={draft.name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={t('project.namePlaceholder')}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="world-prompt">{t('project.initialPrompt')}</FieldLabel>
          <Textarea
            id="world-prompt"
            value={draft.prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            rows={4}
            placeholder={t('project.promptPlaceholder')}
          />
        </Field>
      </FieldGroup>

      <SettingsRowGroup className="mt-5">
        <SettingsRow
          label={t('project.visionModel')}
          description={t('project.visionProvider')}
          htmlFor="vision-model"
        >
          <Select
            value={selectedVisionModel}
            onValueChange={(visionModel) => onGenerationChange({ visionModel })}
          >
            <SelectTrigger
              id="vision-model"
              className="w-56 max-w-[55vw]"
              size="sm"
              aria-label={t('project.visionModel')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visionModelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                  <span className="font-mono text-xs">{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow
          label={t('project.videoModel')}
          description={t('project.videoProvider')}
          htmlFor="video-model"
        >
          <Select value={selectedVideoModel} onValueChange={selectModel}>
            <SelectTrigger
              id="video-model"
              className="w-56 max-w-[55vw]"
              size="sm"
              aria-label={t('project.videoModel')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {videoModelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                  <span className="font-mono text-xs">{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow
          label={t('project.targetFps')}
          description={t('project.outputTransportRate')}
          htmlFor="target-fps"
        >
          <NumberInput
            id="target-fps"
            value={generation.targetFps}
            min={1}
            max={60}
            step={0.5}
            suffix="fps"
            onChange={(event) => updateNumber('targetFps', event)}
          />
        </SettingsRow>
        {supportsFrameRate ? (
          <SettingsRow
            label={t('project.frameRate')}
            description={
              isHostedLtx23 && generation.durationSeconds > 10
                ? t('project.requiredLongClips')
                : t('project.generationTiming')
            }
            htmlFor="frame-rate"
          >
            <NumberInput
              id="frame-rate"
              value={generation.frameRate}
              min={1}
              max={60}
              step={0.5}
              suffix="fps"
              onChange={(event) => updateNumber('frameRate', event)}
            />
          </SettingsRow>
        ) : null}
        {supportsDuration ? (
          <SettingsRow
            label={t('project.duration')}
            description={t('project.hostedDuration')}
            htmlFor="duration"
          >
            <Select
              value={String(
                hostedDurations.includes(
                  generation.durationSeconds as (typeof hostedDurations)[number],
                )
                  ? generation.durationSeconds
                  : 6,
              )}
              onValueChange={(value) =>
                onGenerationChange({
                  durationSeconds: Number(value),
                  ...(Number(value) > 10 ? { frameRate: 25, resolution: '1080p' } : {}),
                })
              }
            >
              <SelectTrigger
                id="duration"
                className="w-28"
                size="sm"
                aria-label={t('project.duration')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hostedDurations.map((duration) => (
                  <SelectItem key={duration} value={String(duration)}>
                    {duration} {t('project.seconds')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
        ) : null}
        {supportsGuidance ? (
          <SettingsRow label={t('project.guidance')} description={t('project.promptInfluence')}>
            <RangeValue
              value={generation.guidanceScale}
              min={0}
              max={20}
              step={0.1}
              onChange={(value) => onGenerationChange({ guidanceScale: value })}
            />
          </SettingsRow>
        ) : null}
        {supportsSeed ? (
          <SettingsRow
            label={t('project.seed')}
            description={t('project.emptyNewSeed')}
            htmlFor="seed"
          >
            <Input
              className="w-28 px-2 text-right tabular-nums"
              id="seed"
              type="number"
              min="0"
              value={generation.seed ?? ''}
              onChange={(event) =>
                onGenerationChange({ seed: event.target.value ? Number(event.target.value) : null })
              }
              placeholder={t('project.random')}
            />
          </SettingsRow>
        ) : null}
      </SettingsRowGroup>

      <FieldGroup className="mt-5 gap-4">
        {supportsNegativePrompt ? (
          <Field>
            <FieldLabel htmlFor="negative-prompt">{t('project.negativePrompt')}</FieldLabel>
            <Textarea
              id="negative-prompt"
              rows={2}
              value={generation.negativePrompt}
              onChange={(event) => onGenerationChange({ negativePrompt: event.target.value })}
              placeholder={t('project.optionalThingsToAvoid')}
            />
          </Field>
        ) : null}
        <Field>
          <FieldLabel htmlFor="initial-image">
            {t('project.initialImage')}
            {requiresInitialImage ? ' *' : ''}
          </FieldLabel>
          <input
            ref={imageInputRef}
            className="hidden"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                readImage(file, updateInitialImage, setImageError, {
                  invalid: t('project.chooseImageFile'),
                  tooLarge: t('project.imageTooLarge'),
                  failed: t('project.imageReadFailed'),
                });
              }
              event.currentTarget.value = '';
            }}
          />
          <div className="grid gap-2 rounded-lg border border-dashed border-border p-2">
            {generation.initialImageUrl ? (
              <img
                src={generation.initialImageUrl}
                alt="Initial frame"
                className="max-h-40 w-full rounded-md object-contain"
              />
            ) : null}
            <div className="flex items-center gap-2">
              <ImagePlus size={15} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              <Input
                id="initial-image"
                className="h-8 min-w-0 border-0 bg-transparent px-0 shadow-none focus:border-0 focus:ring-0"
                required={requiresInitialImage}
                aria-label={t('project.initialImageUrl')}
                value={generation.initialImageUrl ?? ''}
                onChange={(event) => updateInitialImage(event.target.value)}
                placeholder={t('project.imageUrlUpload')}
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                title={t('project.uploadInitialImage')}
                aria-label={t('project.uploadInitialImage')}
                onClick={() => imageInputRef.current?.click()}
              >
                <Upload size={15} aria-hidden="true" />
              </Button>
            </div>
          </div>
          {imageError ? (
            <FieldDescription className="text-destructive">{imageError}</FieldDescription>
          ) : null}
        </Field>
      </FieldGroup>

      <details className="mt-5 rounded-lg border border-border/70 px-3 open:pb-3">
        <summary className="cursor-pointer py-3 text-sm font-medium text-foreground">
          {t('project.advancedGeneration')}
        </summary>
        <SettingsRowGroup className="border-x-0 border-b-0">
          <SettingsRow
            label={t('project.progression')}
            description={t('project.nextSceneDevelops')}
            htmlFor="progression"
          >
            <Select
              value={generation.mode}
              onValueChange={(value) => {
                if (isGenerationMode(value)) onGenerationChange({ mode: value });
              }}
            >
              <SelectTrigger
                id="progression"
                className="w-44 max-w-[55vw]"
                size="sm"
                aria-label={t('project.progression')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {progressionModes.map((mode) => (
                  <SelectItem className="capitalize" key={mode} value={mode}>
                    {t(`project.mode.${mode}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
          {supportsAudio ? (
            <SettingsRow label={t('project.audio')} description={t('project.includeAudio')}>
              <Switch
                checked={generation.enableAudio}
                onCheckedChange={(enableAudio) => onGenerationChange({ enableAudio })}
                aria-label={t('project.enableAudio')}
              />
            </SettingsRow>
          ) : null}
          {supportsTimesteps ? (
            <SettingsRow
              label={t('project.timesteps')}
              description={t('project.commaDiffusionSchedule')}
              htmlFor="timesteps"
            >
              <Input
                id="timesteps"
                className="w-56"
                value={generation.timesteps.join(', ')}
                onChange={(event) =>
                  onGenerationChange({ timesteps: parseFloatList(event.target.value) })
                }
              />
            </SettingsRow>
          ) : null}
          {isHostedLtx23 ? (
            <SettingsRow
              label={t('project.resolution')}
              description={
                generation.durationSeconds > 10
                  ? t('project.required1080p')
                  : t('project.hostedModelPreset')
              }
              htmlFor="resolution"
            >
              <Select
                value={hostedResolution}
                onValueChange={(value) =>
                  onGenerationChange({
                    resolution:
                      value === 'auto' ? null : (value as GenerationSettings['resolution']),
                  })
                }
              >
                <SelectTrigger
                  id="resolution"
                  className="w-44"
                  size="sm"
                  aria-label={t('project.resolution')}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resolutionOptions
                    .filter(([value]) => generation.durationSeconds <= 10 || value === '1080p')
                    .map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {value === 'auto' ? t('project.auto') : label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </SettingsRow>
          ) : null}
          {isHostedLtx23 ? (
            <SettingsRow
              label={t('project.aspectRatio')}
              description={t('project.hostedModelFraming')}
              htmlFor="aspect-ratio"
            >
              <Select
                value={generation.aspectRatio ?? 'auto'}
                onValueChange={(value) =>
                  onGenerationChange({ aspectRatio: value as GenerationSettings['aspectRatio'] })
                }
              >
                <SelectTrigger
                  id="aspect-ratio"
                  className="w-44"
                  size="sm"
                  aria-label={t('project.aspectRatio')}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatioOptions.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsRow>
          ) : null}
        </SettingsRowGroup>
      </details>
    </div>
  );
}

function NumberInput({
  id,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        className="w-20 px-2 text-right tabular-nums"
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
      />
      {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
    </div>
  );
}

function RangeValue({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex w-48 max-w-[55vw] items-center gap-2">
      <Slider
        className="min-w-0 flex-1"
        aria-label="Value"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([next]) => {
          if (next !== undefined) onChange(next);
        }}
      />
      <output className="w-10 text-right text-xs tabular-nums text-muted-foreground">
        {value.toFixed(step < 0.1 ? 2 : 1)}
      </output>
    </div>
  );
}

function parseFloatList(value: string): number[] {
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter(Number.isFinite);
}
