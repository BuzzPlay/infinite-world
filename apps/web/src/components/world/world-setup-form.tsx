import { useEffect, useRef, useState, type ChangeEvent, type RefObject } from 'react';
import type { GenerationMode, GenerationSettings, WorldConfig } from '@infinite-world/api-contract';
import { ImagePlus, Plus, Trash2, Upload } from 'lucide-react';

import { Button } from '../ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SettingsRow, SettingsRowGroup } from '../ui/settings-row';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

interface WorldSetupFormProps {
  draft: WorldConfig;
  onNameChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
  className?: string;
}

export const generationModelOptions = [
  { value: 'demo-continuous', label: 'Demo generator' },
  { value: 'fal-ltx-video', label: 'FAL LTX Video' },
  { value: 'fal-ltx-2.3', label: 'FAL LTX 2.3' },
  { value: 'ltx-2.3', label: 'LTX 2.3 · hosted' },
  { value: 'ltxv1', label: 'Local LTX v1' },
  { value: 'ltx-2.3-local', label: 'Local LTX 2.3' },
  { value: 'ltx-2.3-condition', label: 'Local LTX 2.3 · references' },
] as const;

const progressionModes: readonly GenerationMode[] = [
  'regular',
  'nightmare',
  'cohesive',
  'visual',
  'chaotic',
];
const canvasOptions = [
  ['512x384', '4:3 · 512 x 384'],
  ['512x288', '16:9 · 512 x 288'],
  ['640x480', '4:3 · 640 x 480'],
  ['1280x720', '16:9 · 1280 x 720'],
  ['1024x1024', '1:1 · 1024 x 1024'],
  ['720x1280', '9:16 · 720 x 1280'],
] as const;
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
) {
  if (!file.type.startsWith('image/')) {
    onError('Choose an image file.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    onError('Images must be smaller than 10 MB.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') onReady(reader.result);
    else onError('The image could not be read.');
  };
  reader.onerror = () => onError('The image could not be read.');
  reader.readAsDataURL(file);
}

export function modelRequiresInitialImage(model: string) {
  return ['ltxv1', 'ltx-2.3-local', 'ltx-2.3-condition', 'fal-ltx-2.3', 'ltx-2.3'].includes(model);
}

export function WorldSetupForm({
  draft,
  onNameChange,
  onPromptChange,
  onGenerationChange,
  className,
}: WorldSetupFormProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const generation = draft.generation;
  const isHostedLtxVideo = generation.model === 'fal-ltx-video';
  const isHostedLtx23 = generation.model === 'fal-ltx-2.3' || generation.model === 'ltx-2.3';
  const isLocalModel = ['ltxv1', 'ltx-2.3-local', 'ltx-2.3-condition'].includes(generation.model);
  const supportsCanvas = isLocalModel;
  const supportsFrameRate = isLocalModel || isHostedLtx23;
  const supportsDuration = isHostedLtx23;
  const supportsNumFrames = isLocalModel;
  const supportsGuidance = isLocalModel || isHostedLtxVideo;
  const supportsStrength = isLocalModel;
  const supportsSeed = isLocalModel || isHostedLtxVideo;
  const supportsNegativePrompt = !isHostedLtx23;
  const supportsTimesteps = isLocalModel || isHostedLtxVideo;
  const supportsAudio = isLocalModel || isHostedLtx23;
  const supportsLocalControls =
    generation.model === 'ltx-2.3-local' || generation.model === 'ltx-2.3-condition';
  const isConditionModel = generation.model === 'ltx-2.3-condition';
  const requiresInitialImage = modelRequiresInitialImage(generation.model);
  const hostedResolution =
    isHostedLtx23 && generation.durationSeconds > 10 ? '1080p' : (generation.resolution ?? 'auto');

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
    if (model === 'fal-ltx-2.3' || model === 'ltx-2.3') {
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
          <FieldLabel htmlFor="world-name">Name</FieldLabel>
          <Input
            id="world-name"
            value={draft.name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="A name for this world"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="world-prompt">Initial prompt</FieldLabel>
          <Textarea
            id="world-prompt"
            value={draft.prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            rows={4}
            placeholder="Describe the opening scene"
          />
        </Field>
      </FieldGroup>

      <SettingsRowGroup className="mt-5">
        <SettingsRow label="Model" description="Generation provider" htmlFor="model">
          <Select value={generation.model} onValueChange={selectModel}>
            <SelectTrigger id="model" className="w-56 max-w-[55vw]" size="sm" aria-label="Model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {generationModelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        {supportsCanvas ? (
          <SettingsRow label="Canvas" description="Generation and output size" htmlFor="format">
            <Select
              value={`${generation.width}x${generation.height}`}
              onValueChange={(format) => {
                const [width, height] = format.split('x').map(Number);
                onGenerationChange({ width, height });
              }}
            >
              <SelectTrigger
                id="format"
                className="w-44 max-w-[55vw]"
                size="sm"
                aria-label="Canvas"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {canvasOptions.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
        ) : null}
        <SettingsRow label="Target FPS" description="Output transport rate" htmlFor="target-fps">
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
            label="Frame rate"
            description={
              isHostedLtx23 && generation.durationSeconds > 10
                ? 'Required for clips over 10 seconds'
                : 'Generation timing'
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
          <SettingsRow label="Duration" description="Supported hosted duration" htmlFor="duration">
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
              <SelectTrigger id="duration" className="w-28" size="sm" aria-label="Duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hostedDurations.map((duration) => (
                  <SelectItem key={duration} value={String(duration)}>
                    {duration} sec
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
        ) : null}
        {supportsNumFrames ? (
          <SettingsRow label="Frames" description="Frame-based models" htmlFor="num-frames">
            <NumberInput
              id="num-frames"
              value={generation.numFrames}
              min={9}
              max={1001}
              step={8}
              onChange={(event) => updateNumber('numFrames', event)}
            />
          </SettingsRow>
        ) : null}
        {supportsGuidance ? (
          <SettingsRow label="Guidance" description="Prompt influence">
            <RangeValue
              value={generation.guidanceScale}
              min={0}
              max={20}
              step={0.1}
              onChange={(value) => onGenerationChange({ guidanceScale: value })}
            />
          </SettingsRow>
        ) : null}
        {supportsStrength ? (
          <SettingsRow label="Image strength" description="Initial image influence">
            <RangeValue
              value={generation.strength}
              min={0}
              max={2}
              step={0.1}
              onChange={(value) => onGenerationChange({ strength: value })}
            />
          </SettingsRow>
        ) : null}
        {supportsSeed ? (
          <SettingsRow label="Seed" description="Empty uses a new seed" htmlFor="seed">
            <Input
              className="w-28 px-2 text-right tabular-nums"
              id="seed"
              type="number"
              min="0"
              value={generation.seed ?? ''}
              onChange={(event) =>
                onGenerationChange({ seed: event.target.value ? Number(event.target.value) : null })
              }
              placeholder="Random"
            />
          </SettingsRow>
        ) : null}
      </SettingsRowGroup>

      <FieldGroup className="mt-5 gap-4">
        {supportsNegativePrompt ? (
          <Field>
            <FieldLabel htmlFor="negative-prompt">Negative prompt</FieldLabel>
            <Textarea
              id="negative-prompt"
              rows={2}
              value={generation.negativePrompt}
              onChange={(event) => onGenerationChange({ negativePrompt: event.target.value })}
              placeholder="Optional things to avoid"
            />
          </Field>
        ) : null}
        <Field>
          <FieldLabel htmlFor="initial-image">
            Initial image{requiresInitialImage ? ' *' : ''}
          </FieldLabel>
          <input
            ref={imageInputRef}
            className="hidden"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) readImage(file, updateInitialImage, setImageError);
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
                aria-label="Initial image URL"
                value={generation.initialImageUrl ?? ''}
                onChange={(event) => updateInitialImage(event.target.value)}
                placeholder="Image URL or upload a file"
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                title="Upload initial image"
                aria-label="Upload initial image"
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
          Advanced generation
        </summary>
        <SettingsRowGroup className="border-x-0 border-b-0">
          <SettingsRow
            label="Progression"
            description="How the next scene develops"
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
                aria-label="Progression"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {progressionModes.map((mode) => (
                  <SelectItem className="capitalize" key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
          {supportsLocalControls ? (
            <SettingsRow label="Noise" description="Variation between scenes">
              <RangeValue
                value={generation.noiseScale}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => onGenerationChange({ noiseScale: value })}
              />
            </SettingsRow>
          ) : null}
          {supportsLocalControls ? (
            <SettingsRow label="STG" description="Motion structure guidance">
              <RangeValue
                value={generation.stgScale}
                min={0}
                max={10}
                step={0.1}
                onChange={(value) => onGenerationChange({ stgScale: value })}
              />
            </SettingsRow>
          ) : null}
          {supportsLocalControls ? (
            <SettingsRow
              label="STG blocks"
              description="Comma-separated transformer blocks"
              htmlFor="stg-blocks"
            >
              <Input
                id="stg-blocks"
                className="w-44"
                value={generation.spatioTemporalGuidanceBlocks?.join(', ') ?? ''}
                onChange={(event) =>
                  onGenerationChange({
                    spatioTemporalGuidanceBlocks: parseList(event.target.value),
                  })
                }
                placeholder="e.g. 0, 1, 2"
              />
            </SettingsRow>
          ) : null}
          {supportsAudio ? (
            <SettingsRow label="Audio" description="Include audio when supported">
              <Switch
                checked={generation.enableAudio}
                onCheckedChange={(enableAudio) => onGenerationChange({ enableAudio })}
                aria-label="Enable audio"
              />
            </SettingsRow>
          ) : null}
          {supportsTimesteps ? (
            <SettingsRow
              label="Timesteps"
              description="Comma-separated diffusion schedule"
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
              label="Resolution"
              description={
                generation.durationSeconds > 10
                  ? '1080p is required above 10 seconds'
                  : 'Hosted model preset'
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
                <SelectTrigger id="resolution" className="w-44" size="sm" aria-label="Resolution">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resolutionOptions
                    .filter(([value]) => generation.durationSeconds <= 10 || value === '1080p')
                    .map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </SettingsRow>
          ) : null}
          {isHostedLtx23 ? (
            <SettingsRow
              label="Aspect ratio"
              description="Hosted model framing"
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
                  aria-label="Aspect ratio"
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

      {isConditionModel ? (
        <CharacterReferences
          references={generation.characterRefs}
          onChange={(characterRefs) => onGenerationChange({ characterRefs })}
          onError={setImageError}
          inputRef={referenceInputRef}
        />
      ) : null}
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

function CharacterReferences({
  references,
  onChange,
  onError,
  inputRef,
}: {
  references: GenerationSettings['characterRefs'];
  onChange: (references: GenerationSettings['characterRefs']) => void;
  onError: (message: string) => void;
  inputRef: RefObject<HTMLInputElement>;
}) {
  const addReference = (image: string) =>
    onChange([...references, { image, label: '', strength: 0.4 }]);
  return (
    <section className="mt-5 grid gap-2" aria-labelledby="character-references-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 id="character-references-title" className="text-sm font-medium text-foreground">
            Character references
          </h3>
          <p className="text-xs text-muted-foreground">
            Up to four images for identity consistency.
          </p>
        </div>
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) readImage(file, addReference, onError);
            event.currentTarget.value = '';
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={references.length >= 4}
          onClick={() => inputRef.current?.click()}
        >
          <Plus size={14} aria-hidden="true" /> Add image
        </Button>
      </div>
      {references.map((reference, index) => (
        <div
          key={reference.image}
          className="grid gap-2 rounded-lg border border-border/70 p-2 sm:grid-cols-[5rem_1fr_auto]"
        >
          <img
            src={reference.image}
            alt=""
            className="size-20 rounded-md object-cover sm:size-16"
          />
          <div className="grid min-w-0 gap-2 sm:grid-cols-2">
            <Input
              aria-label={`Character ${index + 1} label`}
              value={reference.label}
              onChange={(event) =>
                onChange(
                  references.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, label: event.target.value } : item,
                  ),
                )
              }
              placeholder="Character label"
            />
            <div className="flex items-center gap-2">
              <Slider
                aria-label={`Character ${index + 1} strength`}
                min={0}
                max={1}
                step={0.05}
                value={[reference.strength]}
                onValueChange={([strength]) => {
                  if (strength !== undefined)
                    onChange(
                      references.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, strength } : item,
                      ),
                    );
                }}
              />
              <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                {reference.strength.toFixed(2)}
              </span>
            </div>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title="Remove reference"
            aria-label={`Remove character ${index + 1}`}
            onClick={() => onChange(references.filter((_, itemIndex) => itemIndex !== index))}
          >
            <Trash2 size={15} aria-hidden="true" />
          </Button>
        </div>
      ))}
    </section>
  );
}

function parseList(value: string): number[] | null {
  const values = value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter(Number.isInteger);
  return values.length ? values : null;
}

function parseFloatList(value: string): number[] {
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter(Number.isFinite);
}
