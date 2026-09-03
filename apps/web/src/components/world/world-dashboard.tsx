import { useEffect, useRef, useState, type RefObject } from 'react';
import { X } from 'lucide-react';
import type {
  GenerationSettings,
  RunSnapshot,
  RunState,
  SceneSnapshot,
  WorldConfig,
} from '@infinite-world/api-contract';

import { Button } from '../ui/button';
import { Alert, AlertActions, AlertDescription } from '../ui/alert';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '@/lib/utils';
import { LiveOutputView } from './live-output-view';
import { PreviewCanvas, type RunAction } from './preview-panel';
import { ProjectSettingsPanel } from './project-settings-panel';
import { RunMetrics } from './run-metrics';
import { SceneHistory } from './scene-history';
import { GenerationHistory } from './generation-history';
import { SidebarToggle } from '../layout/sidebar-toggle';
import type { LiveOutputSettings } from './live-output-types';

interface WorldDashboardProps {
  draft: WorldConfig;
  run: RunSnapshot | null;
  scenes: SceneSnapshot[];
  busy: string | null;
  loading: boolean;
  twitchStreamKeyConfigured: boolean;
  notice: string | null;
  onDismissNotice: () => void;
  previewRef: RefObject<HTMLDivElement>;
  onNameChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
  onAction: (action: RunAction, output?: LiveOutputSettings) => void;
  onOptionSelect: (optionId: string) => void;
  onSave: () => void;
  onApplyRuntime: () => void;
}

export function WorldDashboard({
  draft,
  run,
  scenes,
  busy,
  loading,
  twitchStreamKeyConfigured,
  notice,
  onDismissNotice,
  previewRef,
  onNameChange,
  onPromptChange,
  onGenerationChange,
  onAction,
  onOptionSelect,
  onSave,
  onApplyRuntime,
}: WorldDashboardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const livePreviewRef = useRef<HTMLDivElement>(null);
  const { state: sidebarState } = useSidebar();
  const state: RunState = run?.state ?? 'created';
  const isRunning = state === 'running' || state === 'preparing';
  const isActive = isRunning || state === 'stopping';
  const currentScene = run?.currentScene ?? scenes[scenes.length - 1] ?? null;

  useEffect(() => {
    setSelectedOptionId(null);
  }, [currentScene?.id]);

  return (
    <Tabs
      defaultValue="preview"
      className="relative h-full min-h-0 overflow-hidden bg-background text-foreground"
      key={run?.worldId ?? 'world-dashboard'}
    >
      <SidebarTrigger
        className="pointer-events-auto absolute left-3 top-3 z-30 md:hidden"
        title="Open sidebar"
        aria-label="Open sidebar"
      />
      <SidebarToggle placement="floating" />
      <div
        className={cn(
          'pointer-events-none absolute top-3 z-30',
          sidebarState === 'collapsed' ? 'left-14' : 'left-4',
        )}
      >
        <TabsList className="pointer-events-auto">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
      </div>
      {notice ? (
        <Alert
          variant="warning"
          className="pointer-events-auto absolute left-3 right-3 top-20 z-30 mx-auto max-w-xl shadow-sm backdrop-blur-md sm:left-1/2 sm:right-auto sm:w-[min(36rem,calc(100%-3rem))] sm:-translate-x-1/2"
        >
          <AlertDescription>{notice}</AlertDescription>
          <AlertActions>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-amber-800 hover:bg-amber-500/10 hover:text-amber-900"
              onClick={onDismissNotice}
              aria-label="Dismiss notice"
            >
              <X size={14} aria-hidden="true" />
            </Button>
          </AlertActions>
        </Alert>
      ) : null}

      <TabsContent value="preview" className="absolute inset-0 m-0">
        <PreviewCanvas
          currentScene={currentScene}
          state={state}
          isRunning={isRunning}
          isActive={isActive}
          canRestart={run !== null}
          busy={busy}
          loading={loading}
          previewRef={previewRef}
          selectedOptionId={selectedOptionId}
          onOptionSelect={(optionId) => {
            setSelectedOptionId(optionId);
            onOptionSelect(optionId);
          }}
          onAction={onAction}
        />
      </TabsContent>
      <TabsContent value="live" className="absolute inset-0 m-0">
        <LiveOutputView
          worldId={run?.worldId ?? null}
          outputMode={run?.output?.mode ?? null}
          output={run?.output ?? null}
          currentScene={currentScene}
          state={state}
          isRunning={isRunning}
          isActive={isActive}
          canRestart={run !== null}
          busy={busy}
          loading={loading}
          twitchStreamKeyConfigured={twitchStreamKeyConfigured}
          previewRef={livePreviewRef}
          selectedOptionId={selectedOptionId}
          onOptionSelect={(optionId) => {
            setSelectedOptionId(optionId);
            onOptionSelect(optionId);
          }}
          onAction={onAction}
        />
      </TabsContent>
      <TabsContent
        value="settings"
        className="absolute inset-0 m-0 overflow-y-auto bg-background pt-24 text-foreground sm:pt-20"
      >
        <div className="mx-auto min-h-full w-full max-w-4xl p-4 pb-12 sm:p-8">
          <RunMetrics run={run} />
          <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-2">
            <SceneHistory
              scenes={run?.scenes.length ? run.scenes : scenes}
              currentScene={currentScene}
              onCopy={() => {
                const text = (currentScene?.prompt || currentScene?.contextSummary || '').trim();
                if (text && navigator.clipboard) void navigator.clipboard.writeText(text);
              }}
            />
            <GenerationHistory records={run?.generationHistory ?? []} />
          </div>
          <ProjectSettingsPanel
            draft={draft}
            busy={busy === 'save'}
            onNameChange={onNameChange}
            onPromptChange={onPromptChange}
            onGenerationChange={onGenerationChange}
            onSave={onSave}
            onApplyRuntime={onApplyRuntime}
            runtimeBusy={busy === 'apply'}
            running={isRunning}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
