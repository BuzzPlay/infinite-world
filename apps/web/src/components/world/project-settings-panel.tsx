import type { GenerationSettings, WorldConfig } from '@infinite-world/api-contract';

import { Button } from '../ui/button';
import { SectionCard } from '../ui/section-card';
import { WorldSetupForm } from './world-setup-form';

interface ProjectSettingsPanelProps {
  draft: WorldConfig;
  busy: boolean;
  onNameChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
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
  onSave,
  onApplyRuntime,
  runtimeBusy,
  running,
}: ProjectSettingsPanelProps) {
  return (
    <div className="grid min-w-0 gap-4">
      <SectionCard
        title="Project settings"
        description="Configuration used by the next run"
        action={<div className="flex flex-wrap items-center justify-end gap-2"><Button size="sm" variant="outline" onClick={onApplyRuntime} disabled={!running || runtimeBusy}>{runtimeBusy ? 'Applying' : 'Apply to run'}</Button><Button size="sm" variant="default" onClick={onSave} disabled={busy || running || !draft.name.trim() || !draft.prompt.trim()}>{busy ? 'Saving' : 'Save changes'}</Button></div>}
        flush
      >
        <WorldSetupForm
          draft={draft}
          onNameChange={onNameChange}
          onPromptChange={onPromptChange}
          onGenerationChange={onGenerationChange}
        />
      </SectionCard>
      <p className="px-1 text-xs leading-normal text-muted-foreground">Changes apply when the current run is stopped or when a new run starts.</p>
    </div>
  );
}
