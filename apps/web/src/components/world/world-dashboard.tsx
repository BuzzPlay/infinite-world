import type {
  GenerationSettings,
  RunSnapshot,
  RunState,
  SceneSnapshot,
  WorldConfig,
} from '@infinite-world/api-contract';
import type { ModelCapability } from '@infinite-world/api-contract/model-catalog';
import { type RefObject, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '../../i18n/use-translation';
import { SidebarToggle } from '../layout/sidebar-toggle';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { BranchCanvasDialog } from './branch-canvas-dialog';
import { CustomizePanel } from './customize-panel';
import type { GenerationModelOption } from './model-options';
import { PreviewCanvas, type RunAction } from './preview-panel';
import { ReplayPanel } from './replay-panel';
import { RunSettingsDialog } from './run-settings-dialog';
import { sceneVersionSummaries } from './scene-version-data';
import { SceneVersionsSheet } from './scene-versions-sheet';

interface WorldDashboardProps {
  draft: WorldConfig;
  run: RunSnapshot | null;
  scenes: SceneSnapshot[];
  busy: string | null;
  loading: boolean;
  previewRef: RefObject<HTMLDivElement>;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
  onOpenModelSettings: (capability: ModelCapability) => void;
  visionModelOptions: GenerationModelOption[];
  videoModelOptions: GenerationModelOption[];
  onAction: (action: RunAction) => void;
  onActivateScene: (sceneId: string) => void;
  onOptionSelect: (sceneId: string, optionId: string) => void;
  onInputSubmit: (sceneId: string, input: string) => void;
  onRegenerateOptions: (sceneId: string) => void;
  onDeleteSceneBranch: (sceneId: string) => Promise<RunSnapshot | null>;
  onDeleteVersion: (versionId: string) => Promise<boolean>;
  onRefresh: () => Promise<void>;
  onSave: (config: WorldConfig) => Promise<boolean>;
  projectIcon?: string;
  onProjectIconChange: (icon: string | undefined) => void;
  onRequestDeleteProject: () => void;
}

export function WorldDashboard({
  draft,
  run,
  scenes,
  busy,
  loading,
  previewRef,
  onGenerationChange,
  onOpenModelSettings,
  visionModelOptions,
  videoModelOptions,
  onAction,
  onActivateScene,
  onOptionSelect,
  onInputSubmit,
  onRegenerateOptions,
  onDeleteSceneBranch,
  onDeleteVersion,
  onRefresh,
  onSave,
  projectIcon,
  onProjectIconChange,
  onRequestDeleteProject,
}: WorldDashboardProps) {
  const { t } = useTranslation();
  const [selection, setSelection] = useState<{
    sceneId: string;
    optionId: string;
    runId: string | null;
  } | null>(null);
  const [branchCanvasOpen, setBranchCanvasOpen] = useState(false);
  const [branchCanvasVersionId, setBranchCanvasVersionId] = useState<string | null>(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [runSettingsOpen, setRunSettingsOpen] = useState(false);
  const [viewInteraction, setViewInteraction] = useState(0);
  const { state: sidebarState } = useSidebar();
  const state: RunState = run?.state ?? 'created';
  const isRunning = state === 'running' || state === 'preparing';
  const isActive = isRunning || state === 'stopping';
  const availableScenes = run?.scenes.length ? run.scenes : scenes;
  const currentScene = run?.currentScene ?? null;
  const generationSourceScene = run?.generationTask?.sourceSceneId
    ? (availableScenes.find((scene) => scene.id === run.generationTask?.sourceSceneId) ?? null)
    : busy === 'choice' && selection
      ? (availableScenes.find((scene) => scene.id === selection.sceneId) ?? null)
      : null;
  const generatingChoice = generationSourceScene !== null;
  const previewScene = generationSourceScene ?? (isActive ? currentScene : null);
  const previewSelectedOptionId = generatingChoice
    ? (run?.generationTask?.optionId ?? selection?.optionId ?? null)
    : null;
  const recentVersions = sceneVersionSummaries(availableScenes, run?.versions ?? []);

  const openBranchCanvas = () => {
    setBranchCanvasVersionId(
      previewScene?.versionId ?? defaultBranchVersionId(availableScenes, run, isActive),
    );
    setBranchCanvasOpen(true);
  };
  const deleteSceneBranchFromCanvas = async (sceneId: string) => {
    const nextRun = await onDeleteSceneBranch(sceneId);
    if (!nextRun) return false;

    setSelection(null);
    return true;
  };

  return (
    <Tabs
      defaultValue="preview"
      className="relative h-full min-h-0 overflow-hidden bg-background text-foreground"
      key={run?.worldId ?? 'world-dashboard'}
      onValueChange={(value) => {
        setViewInteraction((current) => current + 1);
        if (value === 'preview') void onRefresh();
      }}
    >
      <SidebarTrigger
        className="pointer-events-auto absolute left-3 top-3 z-30 md:hidden"
        title={t('common.openSidebar')}
        aria-label={t('common.openSidebar')}
      />
      <SidebarToggle placement="floating" />
      <div
        className={cn(
          'pointer-events-none absolute top-3 z-30',
          sidebarState === 'collapsed' ? 'left-14' : 'left-4',
        )}
      >
        <div className="pointer-events-auto rounded-lg border border-border bg-input/90 p-1 text-foreground shadow-sm backdrop-blur-md">
          <TabsList indicatorClassName="bg-background shadow-sm ring-1 ring-foreground/[0.06]">
            <TabsTrigger value="preview">{t('dashboard.preview')}</TabsTrigger>
            <TabsTrigger value="replay">{t('dashboard.replay')}</TabsTrigger>
            <TabsTrigger value="customize">{t('dashboard.customize')}</TabsTrigger>
          </TabsList>
        </div>
      </div>
      <TabsContent value="preview" className="absolute inset-0 m-0">
        <PreviewCanvas
          currentScene={previewScene}
          state={state}
          isRunning={isRunning}
          isActive={isActive}
          busy={busy}
          loading={loading}
          previewRef={previewRef}
          selectedOptionId={previewSelectedOptionId}
          generatingChoice={generatingChoice}
          canOpenBranchCanvas={availableScenes.length > 0}
          canOpenVersions={availableScenes.length > 0}
          onOptionSelect={(sceneId, optionId) => {
            setSelection({ sceneId, optionId, runId: run?.id ?? null });
            onOptionSelect(sceneId, optionId);
          }}
          interactionType={draft.interactionType}
          onInputSubmit={onInputSubmit}
          onRegenerateOptions={(sceneId) => {
            setSelection(null);
            onRegenerateOptions(sceneId);
          }}
          onOpenBranchCanvas={openBranchCanvas}
          onOpenVersions={() => setVersionsOpen(true)}
          recentVersions={recentVersions}
          onSelectVersion={(sceneId) => {
            setSelection(null);
            onActivateScene(sceneId);
          }}
          onStop={() => {
            setSelection(null);
            if (isActive) onAction('stop');
          }}
          onAction={onAction}
          autoResetKey={`${run?.worldId ?? 'empty'}:${viewInteraction}`}
          runModels={{
            generation: draft.generation,
            visionModelOptions,
            videoModelOptions,
            disabled: busy !== null || loading,
            onGenerationChange,
            onOpenRunSettings: () => setRunSettingsOpen(true),
            onOpenModelSettings,
          }}
        />
      </TabsContent>
      <TabsContent value="replay" className="absolute inset-0 m-0">
        <ReplayPanel scenes={availableScenes} initialSceneId={currentScene?.id ?? null} />
      </TabsContent>
      <TabsContent value="customize" className="absolute inset-0 m-0">
        <CustomizePanel
          name={draft.name}
          icon={projectIcon}
          busy={busy === 'save' || busy === 'delete-project'}
          onSaveName={(name) => onSave({ ...draft, name })}
          onIconChange={onProjectIconChange}
          onRequestDelete={onRequestDeleteProject}
        />
      </TabsContent>
      {runSettingsOpen ? (
        <RunSettingsDialog
          open
          draft={draft}
          busy={busy === 'save'}
          running={isActive}
          onOpenChange={setRunSettingsOpen}
          onSave={onSave}
        />
      ) : null}
      <BranchCanvasDialog
        open={branchCanvasOpen}
        scenes={availableScenes}
        runVersionId={run?.id ?? null}
        runVersionNumber={run?.version ?? null}
        selectedVersionId={branchCanvasVersionId}
        selectedSceneId={previewScene?.id ?? null}
        deleting={busy === 'delete-branch'}
        onOpenChange={setBranchCanvasOpen}
        onVersionChange={setBranchCanvasVersionId}
        onSelectScene={(sceneId) => {
          setSelection(null);
          onActivateScene(sceneId);
        }}
        onDeleteSceneBranch={deleteSceneBranchFromCanvas}
      />
      <SceneVersionsSheet
        open={versionsOpen}
        scenes={availableScenes}
        versions={run?.versions ?? []}
        runVersionId={run?.id ?? null}
        selectedSceneId={previewScene?.id ?? null}
        active={isActive}
        deleting={busy === 'delete-version'}
        onOpenChange={setVersionsOpen}
        onSelectVersion={(sceneId) => {
          setSelection(null);
          onActivateScene(sceneId);
        }}
        onDeleteVersion={onDeleteVersion}
      />
    </Tabs>
  );
}

function defaultBranchVersionId(scenes: SceneSnapshot[], run: RunSnapshot | null, active: boolean) {
  if (active && run) return run.id;
  const latestScene = scenes.reduce<SceneSnapshot | null>(
    (latest, scene) => (!latest || scene.version > latest.version ? scene : latest),
    null,
  );
  if (!run || (latestScene && latestScene.version > run.version))
    return latestScene?.versionId ?? null;
  return run.id;
}
