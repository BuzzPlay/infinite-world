import type { GenerationSettings, WorldConfig } from '@infinite-world/api-contract';

import { Button } from '../ui/button';
import { SectionCard } from '../ui/section-card';
import { WorldSetupForm, type GenerationModelOption } from './world-setup-form';
import { useTranslation } from '../../i18n/use-translation';

interface ProjectSettingsPanelProps {
  draft: WorldConfig;
  busy: boolean;
  onNameChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
  visionModelOptions?: GenerationModelOption[];
  videoModelOptions?: GenerationModelOption[];
  onSave: () => void;
  onApplyRuntime: () => void;
  runtimeBusy: boolean;
  running: boolean;
}

export function ProjectSettingsPanel({
  draft,
  busy,
  onNameChange,
  onPromptChange,
  onGenerationChange,
  visionModelOptions,
  videoModelOptions,
  onSave,
  onApplyRuntime,
  runtimeBusy,
  running,
}: ProjectSettingsPanelProps) {
  const { t } = useTranslation();
  const { t: settingsT } = useTranslation('settings');

  return (
    <div className="grid min-w-0 gap-4">
      <SectionCard
        title={t('dashboard.projectSettings')}
        description={t('dashboard.nextRunConfiguration')}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onApplyRuntime}
              disabled={!running || runtimeBusy}
            >
              {runtimeBusy ? t('dashboard.applying') : t('dashboard.applyToRun')}
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={onSave}
              disabled={busy || running || !draft.name.trim() || !draft.prompt.trim()}
            >
              {busy ? settingsT('saving') : t('dashboard.saveChanges')}
            </Button>
          </div>
        }
        flush
      >
        <WorldSetupForm
          draft={draft}
          onNameChange={onNameChange}
          onPromptChange={onPromptChange}
          onGenerationChange={onGenerationChange}
          visionModelOptions={visionModelOptions}
          videoModelOptions={videoModelOptions}
        />
      </SectionCard>
      <p className="px-1 text-xs leading-normal text-muted-foreground">
        {t('dashboard.changesApplyLater')}
      </p>
    </div>
  );
}
