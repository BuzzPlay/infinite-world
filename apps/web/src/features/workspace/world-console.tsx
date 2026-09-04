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
import { isModelConfigured } from '@infinite-world/api-contract/model-catalog';

import { Alert, AlertActions, AlertDescription } from '@/components/ui/alert';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { PageShell } from '@/components/layout/page-shell';
import { SidebarToggle } from '@/components/layout/sidebar-toggle';
import {
  CreateProjectDialog,
  type CreateProjectInput,
} from '@/components/projects/create-project-dialog';
import type { ProjectRecord } from '@/components/projects/project-types';
import { projectFromWorld } from '@/components/projects/project-types';
import { RenameProjectDialog } from '@/components/projects/rename-project-dialog';
import { ProviderSettingsPage } from '@/components/settings/provider-settings-page';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { WorldDashboard } from '@/components/world/world-dashboard';
import { defaultWorldConfig } from '@/components/world/world-defaults';
import { generationModelOptionsFor, visionModelOptionsFor } from '@/components/world/model-options';
import { runStateRank } from '@/components/world/run-state';
import {
  chooseSceneOption,
  createWorld,
  getCurrentWorld,
  getProviderSettings,
  listWorlds,
  restartRun,
  selectWorld,
  startRun,
  stopRun,
  subscribeToEvents,
  subscribeToRunMetrics,
  updateProviderSettings,
  updateWorld,
} from '@/lib/api';
import { deduplicateProjects, loadProjects, saveProjects } from '@/lib/project-store';
import { useTranslation } from '@/i18n/use-translation';
type AppAction = 'start' | 'stop' | 'restart';
type BusyAction = AppAction | 'save' | 'create' | 'select' | 'rename' | 'choice';

function WorldConsole() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [world, setWorld] = useState<WorldSnapshot | null>(null);
  const [run, setRun] = useState<RunSnapshot | null>(null);
  const [draft, setDraft] = useState<WorldConfig>(defaultWorldConfig);
  const [scenes, setScenes] = useState<SceneSnapshot[]>([]);
  const [providerSettings, setProviderSettings] = useState<ProviderSettings>({
    falApiKeyConfigured: false,
    googleApiKeyConfigured: false,
    defaultStylePreset: 'cohesive',
    twitchChannel: '',
    twitchUsername: '',
    chatLookback: 5,
    twitchStreamKeyConfigured: false,
    twitchOauthTokenConfigured: false,
  });
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [busy, setBusy] = useState<BusyAction | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<ProjectRecord | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const runIdRef = useRef<string | null>(null);
  const runStartedAtRef = useRef<string | null>(null);
  const worldIdRef = useRef<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const applyRun = useCallback((nextRun: RunSnapshot) => {
    const isNewRun =
      runIdRef.current !== nextRun.id || runStartedAtRef.current !== nextRun.startedAt;
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
      const existing =
        current.find((project) => project.worldId === response.world.id) ??
        (existingProjectId
          ? current.find((project) => project.id === existingProjectId)
          : undefined);
      const nextProject = projectFromWorld(
        response.world,
        response.providerApiKeyConfigured,
        existing,
      );
      const next = deduplicateProjects([
        nextProject,
        ...current.filter(
          (project) => project.id !== nextProject.id && project.worldId !== response.world.id,
        ),
      ]);
      saveProjects(next);
      return next;
    });
    setActiveProjectId(existingProjectId ?? response.world.id);
  }, []);

  const applyWorldResponse = useCallback(
    (response: WorldResponse, existingProjectId?: string) => {
      worldIdRef.current = response.world.id;
      setWorld(response.world);
      applyRun(response.run);
      setDraft(worldToConfig(response.world));
      syncProject(response, existingProjectId);
      const currentScene = response.run.currentScene;
      if (currentScene) {
        setScenes((current) => mergeScenes(current, currentScene));
      }
    },
    [applyRun, syncProject],
  );

  const applyRunResponse = useCallback(
    (nextWorld: WorldSnapshot, nextRun: RunSnapshot) => {
      setWorld(nextWorld);
      applyRun(nextRun);
    },
    [applyRun],
  );

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
    setProjects(loadProjects());
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

  const currentWorldId = world?.id ?? null;
  const currentRunState = run?.state ?? null;

  useEffect(() => {
    if (!currentWorldId || !isLiveRunState(currentRunState)) return;
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
  }, [applyRun, currentRunState, currentWorldId, syncProject]);

  useEffect(() => {
    if (!currentWorldId || !isLiveRunState(currentRunState)) return;
    return subscribeToRunMetrics(currentWorldId, (metrics) => {
      setRun((current) => {
        if (!current || current.id !== metrics.runId) return current;
        return { ...current, state: metrics.state, metrics: metrics.metrics };
      });
    });
  }, [currentRunState, currentWorldId]);

  const isDirty = useMemo(() => {
    if (!world) return false;
    return JSON.stringify(draft) !== JSON.stringify(worldToConfig(world));
  }, [draft, world]);

  const saveWorldConfig = async (config: WorldConfig) => {
    setBusy('save');
    setNotice(null);
    try {
      const response = world ? await updateWorld(world.id, config) : await createWorld(config);
      applyWorldResponse(response, activeProjectId ?? undefined);
      setNotice(t('dashboard.projectSaved'));
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('dashboard.requestFailed'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const perform = async (action: AppAction, output?: LiveOutputSettings) => {
    setBusy(action);
    setNotice(null);
    try {
      if (action === 'start' || action === 'restart') {
        if (draft.generation.model === 'none') {
          setNotice(t('dashboard.selectVideoModel'));
          return;
        }
        if (
          !isModelConfigured('video', draft.generation.model, {
            googleApiKeyConfigured: providerSettings.googleApiKeyConfigured,
            falApiKeyConfigured: providerSettings.falApiKeyConfigured,
          }) ||
          !isModelConfigured('vision', draft.generation.visionModel, {
            googleApiKeyConfigured: providerSettings.googleApiKeyConfigured,
            falApiKeyConfigured: providerSettings.falApiKeyConfigured,
          })
        ) {
          setNotice(t('dashboard.configureProvider'));
          return;
        }
      }
      if (action === 'start') {
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
        let activeWorld = world;
        if (isDirty) {
          const response = await updateWorld(world.id, draft);
          applyWorldResponse(response, activeProjectId ?? undefined);
          activeWorld = response.world;
        }
        applyRunResponse(activeWorld, (await restartRun(activeWorld.id)).run);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('dashboard.requestFailed'));
    } finally {
      setBusy(null);
    }
  };

  const createProject = async ({ config }: CreateProjectInput) => {
    setBusy('create');
    setNotice(null);
    try {
      applyWorldResponse(await createWorld(config));
      setCreateProjectOpen(false);
      setSettingsOpen(false);
      setNotice(t('dashboard.projectCreated'));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('dashboard.projectCreateFailed'));
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

  const renameProject = async (project: ProjectRecord, name: string) => {
    setBusy('rename');
    setNotice(null);
    try {
      const currentProject = world?.id === project.worldId;
      const source = currentProject ? draft : project;
      const response = await updateWorld(project.worldId, {
        name,
        prompt: source.prompt,
        generation: source.generation,
      });

      if (currentProject) {
        applyWorldResponse(response, project.id);
      } else {
        const nextProjects = deduplicateProjects(
          projects.map((item) =>
            item.id === project.id
              ? projectFromWorld(response.world, response.providerApiKeyConfigured, item)
              : item,
          ),
        );
        setProjects(nextProjects);
        saveProjects(nextProjects);
      }
      setNotice(t('dashboard.projectRenamed'));
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('dashboard.projectRenameFailed'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const chooseOption = async (optionId: string) => {
    if (!world || !run || run.state !== 'running') return;
    setBusy('choice');
    setNotice(null);
    try {
      applyRunResponse(world, (await chooseSceneOption(world.id, optionId)).run);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('dashboard.directionFailed'));
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
      setNotice(t('dashboard.stopBeforeSwitching'));
      return;
    }
    if (world && isDirty) {
      setNotice(t('dashboard.saveBeforeSwitching'));
      return;
    }
    setBusy('select');
    setSettingsOpen(false);
    setNotice(null);
    try {
      const response = await selectWorld(project.worldId);
      applyWorldResponse(response, project.id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('dashboard.projectLoadFailed'));
    } finally {
      setBusy(null);
    }
  };

  const showEmptyState = !settingsOpen && !loading && !world;

  return (
    <PageShell className={world ? 'relative bg-background' : undefined}>
      <div
        data-slot="sidebar-left-slot"
        className="overflow-hidden transition-[max-width,opacity] duration-500 ease-out"
      >
        <AppSidebar
          projects={projects}
          activeProjectId={activeProjectId}
          onCreateProject={() => {
            setSettingsOpen(false);
            setCreateProjectOpen(true);
          }}
          onProjectSelect={(project) => void selectProject(project)}
          onProjectRename={setProjectToRename}
          onOpenSettings={openSettings}
          onOpenWorkspace={openWorkspace}
          settingsActive={settingsOpen}
        />
      </div>
      <SidebarInset className="min-h-0 min-w-0">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {settingsOpen ? (
            <>
              <SidebarToggle placement="floating" />
              <ProviderSettingsPage
                settings={providerSettings}
                loading={settingsLoading}
                busy={settingsBusy}
                onSave={saveProviderSettings}
              />
            </>
          ) : world ? (
            <WorldDashboard
              draft={draft}
              run={run}
              scenes={scenes}
              busy={busy}
              loading={loading}
              visionModelOptions={visionModelOptionsFor(
                providerSettings.googleApiKeyConfigured,
                providerSettings.falApiKeyConfigured,
              )}
              videoModelOptions={generationModelOptionsFor(providerSettings.falApiKeyConfigured)}
              twitchStreamKeyConfigured={providerSettings.twitchStreamKeyConfigured}
              notice={notice}
              onDismissNotice={() => setNotice(null)}
              previewRef={previewRef}
              onGenerationChange={(changes) =>
                setDraft((current) => ({
                  ...current,
                  generation: { ...current.generation, ...changes },
                }))
              }
              onAction={(action, output) => void perform(action, output)}
              onOptionSelect={(optionId) => void chooseOption(optionId)}
              onSave={saveWorldConfig}
            />
          ) : (
            <>
              <SidebarToggle placement="floating" />
              <SidebarTrigger
                className="pointer-events-auto absolute left-3 top-3 z-30 md:hidden"
                title={t('common.openSidebar')}
                aria-label={t('common.openSidebar')}
              />
              {notice ? (
                <Alert
                  variant="warning"
                  className="absolute left-4 right-4 top-4 z-20 mx-auto max-w-xl"
                >
                  <AlertDescription>{notice}</AlertDescription>
                  <AlertActions>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-amber-800 hover:bg-amber-500/10 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-200"
                      onClick={() => setNotice(null)}
                      aria-label={t('common.dismissNotice')}
                    >
                      <X size={15} aria-hidden="true" />
                    </Button>
                  </AlertActions>
                </Alert>
              ) : null}
              <div className="grid h-full min-h-0 min-w-0 place-items-center px-4 py-8 sm:px-6 lg:px-12">
                {showEmptyState ? (
                  <SectionCard
                    className="w-full max-w-xl"
                    title={t('empty.createYourProject')}
                    description={t('empty.createDescription')}
                    bodyClassName="flex flex-wrap items-center justify-between gap-4 px-5 pb-5 pt-0"
                  >
                    <p className="max-w-md text-sm leading-normal text-muted-foreground">
                      {t('empty.createDetails')}
                    </p>
                    <Button variant="default" onClick={() => setCreateProjectOpen(true)}>
                      <Plus size={15} aria-hidden="true" /> {t('common.newProject')}
                    </Button>
                  </SectionCard>
                ) : (
                  <div
                    className="grid min-h-72 place-items-center text-sm text-muted-foreground"
                    role="status"
                  >
                    {t('empty.loadingProject')}
                  </div>
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
      />
      {projectToRename ? (
        <RenameProjectDialog
          project={projectToRename}
          busy={busy === 'rename'}
          onOpenChange={(open) => {
            if (!open) setProjectToRename(null);
          }}
          onRename={renameProject}
        />
      ) : null}
    </PageShell>
  );
}

function worldToConfig(world: WorldSnapshot): WorldConfig {
  return { name: world.name, prompt: world.prompt, generation: world.generation };
}

function mergeScenes(current: SceneSnapshot[], next: SceneSnapshot): SceneSnapshot[] {
  return mergeSceneList(current, [next]);
}

function mergeSceneList(current: SceneSnapshot[], next: SceneSnapshot[]): SceneSnapshot[] {
  const scenes = new Map(current.map((scene) => [scene.id, scene]));
  next.forEach((scene) => {
    scenes.set(scene.id, scene);
  });
  return [...scenes.values()].sort((left, right) => left.sequence - right.sequence).slice(-50);
}

function preferLatestRun(current: RunSnapshot | null, next: RunSnapshot): RunSnapshot {
  if (!current || current.id !== next.id) return next;
  if (current.startedAt !== next.startedAt) return next;
  if (current.sceneCount > next.sceneCount) return current;
  if (
    current.sceneCount === next.sceneCount &&
    runStateRank(current.state) > runStateRank(next.state)
  ) {
    return current;
  }
  return next;
}

function isLiveRunState(state: RunSnapshot['state'] | null) {
  return state === 'preparing' || state === 'running' || state === 'stopping';
}

export default WorldConsole;
