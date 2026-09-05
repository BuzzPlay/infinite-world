import type { GenerationMode, GenerationSettings, WorldConfig } from '@infinite-world/api-contract';
import {
  type VideoModelProfile,
  videoProfileFor,
} from '@infinite-world/api-contract/model-catalog';
import { useTranslation } from '../../i18n/use-translation';
import { Field, FieldGroup, FieldLabel } from '../ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SettingsRow, SettingsRowGroup } from '../ui/settings-row';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { InitialImageField } from './initial-image-field';

interface GenerationSettingsFormProps {
  draft: WorldConfig;
  onPromptChange: (value: string) => void;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
  className?: string;
}

type LongDurationConstraint = NonNullable<VideoModelProfile['longDuration']>;

const progressionModes: readonly GenerationMode[] = [
  'regular',
  'nightmare',
  'cohesive',
  'visual',
  'chaotic',
];

export function GenerationSettingsForm({
  draft,
  onPromptChange,
  onGenerationChange,
  className,
}: GenerationSettingsFormProps) {
  const { t } = useTranslation();
  const generation = draft.generation;
  const profile = videoProfileFor(generation.model);
  const longDuration = activeLongDuration(profile, generation.durationSeconds);

  return (
    <div className={`px-5 py-4 ${className ?? ''}`}>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="run-initial-prompt">{t('project.initialPrompt')}</FieldLabel>
          <Textarea
            id="run-initial-prompt"
            value={draft.prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            rows={4}
            placeholder={t('project.promptPlaceholder')}
          />
        </Field>
      </FieldGroup>

      <InitialImageField
        className="mt-5"
        generation={generation}
        onGenerationChange={onGenerationChange}
      />

      <AdvancedGenerationSettings
        generation={generation}
        profile={profile}
        longDuration={longDuration}
        onGenerationChange={onGenerationChange}
      />
    </div>
  );
}

function AdvancedGenerationSettings({
  generation,
  profile,
  longDuration,
  onGenerationChange,
}: {
  generation: GenerationSettings;
  profile: VideoModelProfile | null;
  longDuration: LongDurationConstraint | null;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
}) {
  const { t } = useTranslation();
  const selectedResolution = longDuration?.resolution ?? generation.resolution ?? '1080p';

  return (
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
        {profile?.supportsAudio ? (
          <SettingsRow label={t('project.audio')} description={t('project.includeAudio')}>
            <Switch
              checked={generation.enableAudio}
              onCheckedChange={(enableAudio) => onGenerationChange({ enableAudio })}
              aria-label={t('project.enableAudio')}
            />
          </SettingsRow>
        ) : null}
        {profile ? (
          <SettingsRow
            label={t('project.resolution')}
            description={longDuration ? t('project.required1080p') : t('project.hostedModelPreset')}
            htmlFor="resolution"
          >
            <Select
              value={selectedResolution}
              onValueChange={(resolution) =>
                onGenerationChange({
                  resolution: resolution as GenerationSettings['resolution'],
                })
              }
              disabled={longDuration !== null}
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
                {profile.resolutions.map((resolution) => (
                  <SelectItem key={resolution} value={resolution}>
                    {resolution}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
        ) : null}
        {profile ? (
          <SettingsRow
            label={t('project.aspectRatio')}
            description={t('project.hostedModelFraming')}
            htmlFor="aspect-ratio"
          >
            <Select
              value={generation.aspectRatio ?? profile.defaults.aspectRatio}
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
                {profile.aspectRatios.map((aspectRatio) => (
                  <SelectItem key={aspectRatio} value={aspectRatio}>
                    {aspectRatio === 'auto' ? t('project.auto') : aspectRatio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
        ) : null}
      </SettingsRowGroup>
    </details>
  );
}

function activeLongDuration(
  profile: VideoModelProfile | null,
  durationSeconds: number,
): LongDurationConstraint | null {
  return profile?.longDuration && durationSeconds > profile.longDuration.aboveSeconds
    ? profile.longDuration
    : null;
}

function isGenerationMode(value: string): value is GenerationMode {
  return progressionModes.includes(value as GenerationMode);
}
