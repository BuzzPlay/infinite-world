'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type {
  RealtimeEvent,
  RunSnapshot,
  SceneSnapshot,
  ProviderSettings,
  UpdateProviderSettingsRequest,
  WorldConfig,
  WorldResponse,
  WorldSnapshot,
  LiveOutputSettings,
} from '@infinite-world/api-contract';

import { Alert, AlertActions, AlertDescription } from '@/components/ui/alert';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { PageShell } from '@/components/layout/page-shell';
import { SidebarToggle } from '@/components/layout/sidebar-toggle';
import { CreateProjectDialog, type CreateProjectInput } from '@/components/projects/create-project-dialog';
import type { ProjectRecord } from '@/components/projects/project-types';
import { projectFromWorld } from '@/components/projects/project-types';
import { ProviderSettingsPage } from '@/components/settings/provider-settings-page';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SIDEBAR_MAX_WIDTH_PX } from '@/components/ui/sidebar-width';
import { WorldDashboard } from '@/components/world/world-dashboard';
import { defaultWorldConfig } from '@/components/world/world-defaults';
import { runStateRank } from '@/components/world/run-state';
import { chooseSceneOption, createWorld, getCurrentWorld, getProviderSettings, listWorlds, restartRun, selectWorld, startRun, stopRun, subscribeToEvents, subscribeToRunMetrics, updateProviderSettings, updateRunConfig, updateWorld } from '@/lib/api';
import { deduplicateProjects, loadProjects, saveProjects } from '@/lib/project-store';
type AppAction = 'save' | 'create' | 'select' | 'start' | 'stop' | 'restart' | 'apply' | 'choice';

function WorldConsole() {
  const [projects, setProjects] = useState<ProjectRecord[]>(loadProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [world, setWorld] = useState<WorldSnapshot | null>(null);
  const [run, setRun] = useState<RunSnapshot | null>(null);
  const [draft, setDraft] = useState<WorldConfig>(defaultWorldConfig);
  const [scenes, setScenes] = useState<SceneSnapshot[]>([]);
  const [providerSettings, setProviderSettings] = useState<ProviderSettings>({
    falApiKeyConfigured: false,
    defaultModel: defaultWorldConfig.generation.model,
    llmTextModel: 'google/gemini-2.5-flash',
    llmVisionModel: 'google/gemini-2.5-flash',
    llmTemperature: 0.7,
    defaultStylePreset: 'cohesive',
    twitchChannel: '',
    twitchUsername: '',
    chatLookback: 5,
    twitchStreamKeyConfigured: false,
    twitchOauthTokenConfigured: false,
    openaiApiKeyConfigured: false,
    groqApiKeyConfigured: false,
  });
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [busy, setBusy] = useState<AppAction | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const runIdRef = useRef<string | null>(null);
  const runStartedAtRef = useRef<string | null>(null);
  const worldIdRef = useRef<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const applyRun = useCallback((nextRun: RunSnapshot) => {
    const isNewRun = runIdRef.current !== nextRun.id || runStartedAtRef.current !== nextRun.startedAt;
    if (isNewRun) setScenes(nextRun.scenes);
    runStartedAtRef.current = nextRun.startedAt;
    runIdRef.current = nextRun.id;
    setRun((current) => preferLatestRun(current, nextRun));
    if (!isNewRun && nextRun.scenes.length) {
      setScenes((current) => mergeSceneList(current, nextRun.scenes));
    }
  }, []);

  const syncProject = useCallback((response: WorldResponse, existingProjectId?: string) => {
    setProjects((current) => {
      const existing = current.find((project) => project.worldId === response.world.id)
        ?? (existingProjectId ? current.find((project) => project.id === existingProjectId) : undefined);
      const nextProject = projectFromWorld(response.world, response.providerApiKeyConfigured, existing);
      const next = deduplicateProjects([nextProject, ...current.filter((project) => project.id !== nextProject.id && project.worldId !== response.world.id)]);
      saveProjects(next);
      return next;
    });
    setActiveProjectId(existingProjectId ?? response.world.id);
  }, []);

  const applyWorldResponse = useCallback((response: WorldResponse, existingProjectId?: string) => {
    worldIdRef.current = response.world.id;
    setWorld(response.world);
    applyRun(response.run);
    setDraft(worldToConfig(response.world));
    syncProject(response, existingProjectId);
    if (response.run.currentScene) {
      setScenes((current) => mergeScenes(current, response.run.currentScene!));
    }
  }, [applyRun, syncProject]);

  const applyRunResponse = useCallback((nextWorld: WorldSnapshot, nextRun: RunSnapshot) => {
    setWorld(nextWorld);
    applyRun(nextRun);
  }, [applyRun]);

  const applyEvent = useCallback(
    (event: RealtimeEvent) => {
      if (event.type === 'snapshot') {
        if (event.world && event.run) {
          applyWorldResponse({
            world: event.world,
            run: event.run,
            providerApiKeyConfigured: event.providerApiKeyConfigured,
          });
        } else {
          worldIdRef.current = null;
          runIdRef.current = null;
          runStartedAtRef.current = null;
          setWorld(null);
          setRun(null);
          setScenes([]);
          setActiveProjectId(null);
        }
        return;
      }
      if (worldIdRef.current && event.run.worldId !== worldIdRef.current) return;
      if (runIdRef.current && event.run.id !== runIdRef.current) return;
      applyRun(event.run);
      if (event.type === 'scene.ready') {
        setScenes((current) => mergeScenes(current, event.scene));
      }
      if (event.type === 'run.error') {
        setNotice(event.message);
      }
    },
    [applyRun, applyWorldResponse],
  );

  useEffect(() => {
    let alive = true;
    getCurrentWorld()
      .then((response) => {
        if (alive) applyWorldResponse(response);
      })
      .catch(() => {
        // A first launch has no world yet; the empty state is intentional.
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    const unsubscribe = subscribeToEvents(applyEvent);
    void listWorlds()
      .then((response) => {
        setProjects((current) => {
          const nextProjects = response.worlds.map((project) => {
            const existing = current.find((item) => item.worldId === project.id);
            return projectFromWorld(project, response.providerApiKeyConfigured, existing);
          });
          saveProjects(nextProjects);
          return nextProjects;
        });
        if (response.activeWorldId) setActiveProjectId(response.activeWorldId);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [applyEvent, applyWorldResponse]);

  useEffect(() => {
    let alive = true;
    getProviderSettings()
      .then((response) => {
        if (alive) setProviderSettings(response);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setSettingsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!world || !run || !['preparing', 'running', 'stopping'].includes(run.state)) {
      return;
    }
    const refresh = () => {
      void getCurrentWorld()
        .then((response) => {
          syncProject(response);
          setWorld(response.world);
          applyRun(response.run);
        })
        .catch(() => undefined);
    };
    const timer = window.setInterval(refresh, 2_000);
    return () => window.clearInterval(timer);
  }, [applyRun, run?.state, syncProject, world?.id]);

  useEffect(() => {
    if (!world || !run || !['preparing', 'running', 'stopping'].includes(run.state)) return;
    return subscribeToRunMetrics(world.id, (metrics) => {
      setRun((current) => {
        if (!current || current.id !== metrics.runId) return current;
        return { ...current, state: metrics.state, metrics: metrics.metrics };
      });
    });
  }, [run?.id, run?.state, world?.id]);

  const isDirty = useMemo(() => {
    if (!world) return false;
    return JSON.stringify(draft) !== JSON.stringify(worldToConfig(world));
  }, [draft, world]);

  const perform = async (action: AppAction, output?: LiveOutputSettings) => {
    setBusy(action);
    setNotice(null);
    try {
      if (action === 'save') {
        const response = world ? await updateWorld(world.id, draft) : await createWorld(draft);
        applyWorldResponse(response, activeProjectId ?? undefined);
        setNotice('Project saved');
      } else if (action === 'apply' && world) {
        const response = await updateRunConfig(world.id, {
          mode: draft.generation.mode,
          width: draft.generation.width,
          height: draft.generation.height,
          durationSeconds: draft.generation.durationSeconds,
          frameRate: draft.generation.frameRate,
          guidanceScale: draft.generation.guidanceScale,
          strength: draft.generation.strength,
          seed: draft.generation.seed,
          negativePrompt: draft.generation.negativePrompt,
          initialImageUrl: draft.generation.initialImageUrl,
          numFrames: draft.generation.numFrames,
          timesteps: draft.generation.timesteps,
          targetFps: draft.generation.targetFps,
          stgScale: draft.generation.stgScale,
          spatioTemporalGuidanceBlocks: draft.generation.spatioTemporalGuidanceBlocks,
          resolution: draft.generation.resolution,
          aspectRatio: draft.generation.aspectRatio,
          noiseScale: draft.generation.noiseScale,
          enableAudio: draft.generation.enableAudio,
          stylePreset: draft.generation.stylePreset,
          characterRefs: draft.generation.characterRefs,
        });
        // PATCH returns the run only. Pull the world snapshot again so the
        // saved runtime values become the draft baseline immediately.
        const current = await getCurrentWorld();
        applyWorldResponse(current, activeProjectId ?? undefined);
        setNotice('Run settings applied');
      } else if (action === 'start') {
        let activeWorld = world;
        if (!activeWorld || isDirty) {
          const response = activeWorld
            ? await updateWorld(activeWorld.id, draft)
            : await createWorld(draft);
          applyWorldResponse(response);
          activeWorld = response.world;
        }
        const response = await startRun(
          activeWorld.id,
          output ? { output } : { outputMode: 'webrtc' },
        );
        applyRunResponse(activeWorld, response.run);
      } else if (action === 'stop' && world) {
        applyRunResponse(world, (await stopRun(world.id)).run);
      } else if (action === 'restart' && world) {
        applyRunResponse(world, (await restartRun(world.id)).run);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The request failed');
    } finally {
      setBusy(null);
    }
  };

  const createProject = async ({ config }: CreateProjectInput) => {
    setBusy('create');
    setNotice(null);
    try {
      if (isHostedModel(config.generation.model) && !providerSettings.falApiKeyConfigured) {
        setNotice('Configure a provider key in Settings before creating this project');
        return;
      }
      applyWorldResponse(await createWorld(config));
      setCreateProjectOpen(false);
      setSettingsOpen(false);
      setNotice('Project created');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The project could not be created');
    } finally {
      setBusy(null);
    }
  };

  const saveProviderSettings = async (nextSettings: UpdateProviderSettingsRequest) => {
    setSettingsBusy(true);
    try {
      const response = await updateProviderSettings(nextSettings);
      setProviderSettings(response);
    } finally {
      setSettingsBusy(false);
    }
  };

  const chooseOption = async (optionId: string) => {
    if (!world || !run || run.state !== 'running') return;
    setBusy('choice');
    setNotice(null);
    try {
      applyRunResponse(world, (await chooseSceneOption(world.id, optionId)).run);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The direction could not be selected');
    } finally {
      setBusy(null);
    }
  };

  const openSettings = () => {
    setCreateProjectOpen(false);
    setSettingsOpen(true);
    setNotice(null);
  };

  const openWorkspace = () => {
    setSettingsOpen(false);
    setNotice(null);
  };

  const selectProject = async (project: ProjectRecord) => {
    if (project.id === activeProjectId || busy !== null) return;
    if (run && ['preparing', 'running', 'stopping'].includes(run.state)) {
      setNotice('Stop the current run before switching projects');
      return;
    }
    if (world && isDirty) {
      setNotice('Save the current project before switching');
      return;
    }
    setBusy('select');
    setSettingsOpen(false);
    setNotice(null);
    try {
      const response = await selectWorld(project.worldId);
      applyWorldResponse(response, project.id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The project could not be loaded');
    } finally {
      setBusy(null);
    }
  };

  const showEmptyState = !settingsOpen && !loading && !world;

  return (
    <PageShell className={world ? 'relative bg-background' : undefined}>
      <div className="min-w-0 shrink-0 overflow-hidden" style={{ maxWidth: SIDEBAR_MAX_WIDTH_PX }}>
        <AppSidebar
          projects={projects}
          activeProjectId={activeProjectId}
          onCreateProject={() => { setSettingsOpen(false); setCreateProjectOpen(true); }}
          onProjectSelect={(project) => void selectProject(project)}
          onOpenSettings={openSettings}
          onOpenWorkspace={openWorkspace}
          settingsActive={settingsOpen}
        />
      </div>
      <SidebarInset className="min-h-0 min-w-0">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {settingsOpen ? (
          <ProviderSettingsPage
            settings={providerSettings}
            loading={settingsLoading}
            busy={settingsBusy}
            onSave={saveProviderSettings}
          />
        ) : world ? (
          <WorldDashboard
            draft={draft}
            run={run}
            scenes={scenes}
            busy={busy}
            loading={loading}
            twitchStreamKeyConfigured={providerSettings.twitchStreamKeyConfigured}
            notice={notice}
            onDismissNotice={() => setNotice(null)}
            previewRef={previewRef}
            onNameChange={(name) => setDraft((current) => ({ ...current, name }))}
            onPromptChange={(prompt) => setDraft((current) => ({ ...current, prompt }))}
            onGenerationChange={(changes) => setDraft((current) => ({ ...current, generation: { ...current.generation, ...changes } }))}
            onAction={(action, output) => void perform(action, output)}
            onOptionSelect={(optionId) => void chooseOption(optionId)}
            onSave={() => void perform('save')}
            onApplyRuntime={() => void perform('apply')}
          />
        ) : (
          <>
            <SidebarToggle placement="floating" />
            <SidebarTrigger className="pointer-events-auto absolute left-3 top-3 z-30 md:hidden" title="Open sidebar" aria-label="Open sidebar" />
            {notice ? <Alert variant="warning" className="absolute left-4 right-4 top-4 z-20 mx-auto max-w-xl"><AlertDescription>{notice}</AlertDescription><AlertActions><Button size="icon" variant="ghost" className="size-7 text-amber-800 hover:bg-amber-500/10 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-200" onClick={() => setNotice(null)} aria-label="Dismiss notice"><X size={15} aria-hidden="true" /></Button></AlertActions></Alert> : null}
            <div className="grid h-full min-h-0 min-w-0 place-items-center px-4 py-8 sm:px-6 lg:px-12">
              {showEmptyState ? (
                <SectionCard
                  className="w-full max-w-xl"
                  title="Create your project"
                  description="Configure a world, then open its live preview."
                  bodyClassName="flex flex-wrap items-center justify-between gap-4 px-5 pb-5 pt-0"
                >
                    <p className="max-w-md text-sm leading-normal text-muted-foreground">Projects keep the prompt and generation settings for each world in this browser.</p>
                    <Button variant="default" onClick={() => setCreateProjectOpen(true)}><Plus size={15} aria-hidden="true" /> New project</Button>
                </SectionCard>
              ) : (
                <div className="grid min-h-72 place-items-center text-sm text-muted-foreground" role="status">Loading project</div>
              )}
            </div>
          </>
        )}
        </div>
      </SidebarInset>
      <CreateProjectDialog
        open={createProjectOpen}
        busy={busy === 'create'}
        providerSettings={providerSettings}
        onOpenChange={setCreateProjectOpen}
        onCreate={createProject}
        onOpenSettings={openSettings}
      />
    </PageShell>
  );
}

function isHostedModel(model: string) {
  return model === 'fal-ltx-video' || model === 'fal-ltx-2.3' || model === 'ltx-2.3';
}

function worldToConfig(world: WorldSnapshot): WorldConfig {
  return { name: world.name, prompt: world.prompt, generation: world.generation };
}

function projectToConfig(project: ProjectRecord): WorldConfig {
  return { name: project.name, prompt: project.prompt, generation: project.generation };
}

function mergeScenes(current: SceneSnapshot[], next: SceneSnapshot): SceneSnapshot[] {
  return mergeSceneList(current, [next]);
}

function mergeSceneList(current: SceneSnapshot[], next: SceneSnapshot[]): SceneSnapshot[] {
  const scenes = new Map(current.map((scene) => [scene.id, scene]));
  next.forEach((scene) => scenes.set(scene.id, scene));
  return [...scenes.values()].sort((left, right) => left.sequence - right.sequence).slice(-50);
}

function preferLatestRun(current: RunSnapshot | null, next: RunSnapshot): RunSnapshot {
  if (!current || current.id !== next.id) return next;
  if (current.startedAt !== next.startedAt) return next;
  if (current.sceneCount > next.sceneCount) return current;
  if (current.sceneCount === next.sceneCount && runStateRank(current.state) > runStateRank(next.state)) {
    return current;
  }
  return next;
}

export default WorldConsole;
