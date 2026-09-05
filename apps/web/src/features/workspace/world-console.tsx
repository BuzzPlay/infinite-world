'use client';

import type {
  ProviderSettings,
  RealtimeEvent,
  RunSnapshot,
  SceneSnapshot,
  UpdateProviderSettingsRequest,
  WorldConfig,
  WorldResponse,
  WorldSnapshot,
} from '@infinite-world/api-contract';
import type { ModelCapability } from '@infinite-world/api-contract/model-catalog';
import { isModelConfigured } from '@infinite-world/api-contract/model-catalog';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { PageShell } from '@/components/layout/page-shell';
import { SidebarToggle } from '@/components/layout/sidebar-toggle';
import {
  CreateProjectDialog,
  type CreateProjectInput,
} from '@/components/projects/create-project-dialog';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import type { ProjectRecord } from '@/components/projects/project-types';
import { projectFromWorld } from '@/components/projects/project-types';
import { RenameProjectDialog } from '@/components/projects/rename-project-dialog';
import { ModelSettingsDialog } from '@/components/settings/model-settings-dialog';
import { ProviderSettingsPage } from '@/components/settings/provider-settings-page';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { dismissToast, errorToast, successToast, warningToast } from '@/components/ui/toast';
import { generationModelOptionsFor, visionModelOptionsFor } from '@/components/world/model-options';
import { WorldDashboard } from '@/components/world/world-dashboard';
import { defaultWorldConfig } from '@/components/world/world-defaults';
import { useTranslation } from '@/i18n/use-translation';
import {
  activateScene,
  chooseSceneOption,
  createWorld,
  deleteRunVersion,
  deleteSceneBranch,
  deleteWorld,
  getCurrentWorld,
  getProviderSettings,
  listWorlds,
  regenerateSceneOptions,
  restartRun,
  selectWorld,
  startRun,
  stopRun,
  submitInteraction,
  subscribeToEvents,
  updateProviderSettings,
  updateRunConfig,
  updateWorld,
} from '@/lib/api';
import { deduplicateProjects, loadProjects, saveProjects } from '@/lib/project-store';

type AppAction = 'start' | 'stop' | 'restart';
type BusyAction =
  | AppAction
  | 'save'
  | 'create'
  | 'select'
  | 'rename'
  | 'delete-project'
  | 'activate-scene'
  | 'choice'
  | 'regenerate-options'
  | 'delete-branch'
  | 'delete-version';

type NoticeTone = 'success' | 'warning' | 'error';

const WORKSPACE_NOTICE_TOAST_ID = 'workspace-notice';

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
  const [projectToDelete, setProjectToDelete] = useState<ProjectRecord | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelSettingsCapability, setModelSettingsCapability] = useState<ModelCapability | null>(
    null,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<NoticeTone>('warning');
  const runIdRef = useRef<string | null>(null);
  const runStartedAtRef = useRef<string | null>(null);
  const runRevisionRef = useRef(-1);
  const worldIdRef = useRef<string | null>(null);
  const choiceInFlightRef = useRef(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const syncRunGeneration = useCallback((nextRun: RunSnapshot) => {
    const generation = activeVersionGeneration(nextRun);
    if (!generation) return;
    setWorld((current) => (current?.id === nextRun.worldId ? { ...current, generation } : current));
    setDraft((current) => ({ ...current, generation }));
  }, []);

  const applyRun = useCallback(
    (nextRun: RunSnapshot) => {
      const switchedVersion = runIdRef.current !== null && runIdRef.current !== nextRun.id;
      const isNewRun =
        runIdRef.current !== nextRun.id || runStartedAtRef.current !== nextRun.startedAt;
      if (!isNewRun && nextRun.revision < runRevisionRef.current) return;
      runStartedAtRef.current = nextRun.startedAt;
      runIdRef.current = nextRun.id;
      runRevisionRef.current = nextRun.revision;
      setRun(nextRun);
      setScenes(nextRun.scenes);
      if (switchedVersion) syncRunGeneration(nextRun);
    },
    [syncRunGeneration],
  );

  const replaceRun = useCallback(
    (nextRun: RunSnapshot) => {
      const switchedVersion = runIdRef.current !== null && runIdRef.current !== nextRun.id;
      runStartedAtRef.current = nextRun.startedAt;
      runIdRef.current = nextRun.id;
      runRevisionRef.current = nextRun.revision;
      setRun(nextRun);
      setScenes(nextRun.scenes);
      if (switchedVersion) syncRunGeneration(nextRun);
    },
    [syncRunGeneration],
  );

  const syncProject = useCallback((response: WorldResponse, existingProjectId?: string) => {
    setProjects((current) => {
      const existing =
        current.find((project) => project.worldId === response.world.id) ??
        (existingProjectId
          ? current.find((project) => project.id === existingProjectId)
          : undefined);
      const nextProject = projectFromWorld(response.world, existing);
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
    },
    [applyRun, syncProject],
  );

  const applyRunResponse = useCallback(
    (nextWorld: WorldSnapshot, nextRun: RunSnapshot) => {
      setWorld(nextWorld);
      applyRun(nextRun);
      syncRunGeneration(nextRun);
    },
    [applyRun, syncRunGeneration],
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
          runRevisionRef.current = -1;
          setWorld(null);
          setRun(null);
          setScenes([]);
          setActiveProjectId(null);
        }
        return;
      }
      if (worldIdRef.current && event.run.worldId !== worldIdRef.current) return;
      if (runIdRef.current && event.run.id !== runIdRef.current) return;
      if (event.type === 'scene.deleted' || event.type === 'version.deleted') {
        replaceRun(event.run);
        return;
      }
      applyRun(event.run);
      if (event.type === 'run.error') {
        setNoticeTone('error');
        setNotice(event.message);
      }
    },
    [applyRun, applyWorldResponse, replaceRun],
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
            return projectFromWorld(project, existing);
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

  const isDirty = useMemo(() => {
    if (!world) return false;
    return JSON.stringify(draft) !== JSON.stringify(worldToConfig(world));
  }, [draft, world]);

  const refreshRun = useCallback(async () => {
    const expectedWorldId = worldIdRef.current;
    if (!expectedWorldId) return;
    try {
      const response = await getCurrentWorld();
      if (response.world.id === expectedWorldId) applyRun(response.run);
    } catch {
      // Realtime updates remain the primary source while a transient refresh fails.
    }
  }, [applyRun]);

  const saveWorldConfig = async (config: WorldConfig) => {
    setBusy('save');
    setNotice(null);
    try {
      const response = world ? await updateWorld(world.id, config) : await createWorld(config);
      applyWorldResponse(response, activeProjectId ?? undefined);
      setNotice(t('dashboard.projectSaved'));
      setNoticeTone('success');
      return true;
    } catch (error) {
      setNoticeTone('error');
      setNotice(error instanceof Error ? error.message : t('dashboard.requestFailed'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const saveRunGeneration = async (changes: Partial<WorldConfig['generation']>) => {
    if (!world || busy !== null) return;
    setBusy('save');
    setNotice(null);
    try {
      const response = await updateRunConfig(world.id, changes);
      const generation = activeVersionGeneration(response.run) ?? {
        ...draft.generation,
        ...changes,
      };
      applyRunResponse({ ...world, generation }, response.run);
    } catch (error) {
      setNoticeTone('error');
      setNotice(error instanceof Error ? error.message : t('dashboard.requestFailed'));
    } finally {
      setBusy(null);
    }
  };

  const perform = async (action: AppAction) => {
    setBusy(action);
    setNotice(null);
    try {
      if (action === 'start' || action === 'restart') {
        if (draft.generation.model === 'none') {
          setNoticeTone('warning');
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
          setNoticeTone('warning');
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
        const response = await startRun(activeWorld.id);
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
      setNoticeTone('error');
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
      setNoticeTone('success');
      setNotice(t('dashboard.projectCreated'));
    } catch (error) {
      setNoticeTone('error');
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
        interactionType: source.interactionType,
        name,
        prompt: source.prompt,
        generation: source.generation,
      });

      if (currentProject) {
        applyWorldResponse(response, project.id);
      } else {
        const nextProjects = deduplicateProjects(
          projects.map((item) =>
            item.id === project.id ? projectFromWorld(response.world, item) : item,
          ),
        );
        setProjects(nextProjects);
        saveProjects(nextProjects);
      }
      setNoticeTone('success');
      setNotice(t('dashboard.projectRenamed'));
      return true;
    } catch (error) {
      setNoticeTone('error');
      setNotice(error instanceof Error ? error.message : t('dashboard.projectRenameFailed'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const removeProject = async (project: ProjectRecord) => {
    if (busy !== null) return false;
    if (
      project.worldId === world?.id &&
      run &&
      ['preparing', 'running', 'stopping'].includes(run.state)
    ) {
      setNoticeTone('warning');
      setNotice(t('project.stopBeforeDelete'));
      return false;
    }

    setBusy('delete-project');
    setNotice(null);
    try {
      const response = await deleteWorld(project.worldId);
      const remainingProjects = projects.filter(
        (item) => item.id !== project.id && item.worldId !== project.worldId,
      );
      setProjects(remainingProjects);
      saveProjects(remainingProjects);

      if (project.worldId === worldIdRef.current) {
        setSettingsOpen(false);
        if (response.activeWorld) {
          const nextProject = remainingProjects.find(
            (item) => item.worldId === response.activeWorld?.world.id,
          );
          applyWorldResponse(response.activeWorld, nextProject?.id);
        } else {
          worldIdRef.current = null;
          runIdRef.current = null;
          runStartedAtRef.current = null;
          runRevisionRef.current = -1;
          setWorld(null);
          setRun(null);
          setScenes([]);
          setDraft(defaultWorldConfig);
          setActiveProjectId(null);
        }
      }

      setNoticeTone('success');
      setNotice(t('project.deleted'));
      return true;
    } catch (error) {
      setNoticeTone('error');
      setNotice(error instanceof Error ? error.message : t('project.deleteFailed'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const chooseOption = async (sceneId: string, optionId: string) => {
    if (!world || !run || busy !== null || choiceInFlightRef.current) return;
    choiceInFlightRef.current = true;
    setBusy('choice');
    setNotice(null);
    try {
      applyRunResponse(world, (await chooseSceneOption(world.id, optionId, sceneId)).run);
    } catch (error) {
      setNoticeTone('error');
      setNotice(error instanceof Error ? error.message : t('dashboard.directionFailed'));
    } finally {
      choiceInFlightRef.current = false;
      setBusy(null);
    }
  };

  const submitUserInteraction = async (sceneId: string, input: string) => {
    if (!world || busy !== null || choiceInFlightRef.current) return;
    choiceInFlightRef.current = true;
    setBusy('choice');
    setNotice(null);
    try {
      applyRunResponse(world, (await submitInteraction(world.id, input, sceneId)).run);
    } catch (error) {
      setNoticeTone('error');
      setNotice(error instanceof Error ? error.message : t('dashboard.directionFailed'));
    } finally {
      choiceInFlightRef.current = false;
      setBusy(null);
    }
  };

  const activateSceneForView = async (sceneId: string) => {
    if (!world || busy !== null) return;
    setBusy('activate-scene');
    setNotice(null);
    try {
      applyRunResponse(world, (await activateScene(world.id, sceneId)).run);
    } catch (error) {
      setNoticeTone('error');
      setNotice(error instanceof Error ? error.message : t('dashboard.sceneActivationFailed'));
    } finally {
      setBusy(null);
    }
  };

  const regenerateOptions = async (sceneId: string) => {
    if (!world || busy !== null) return;
    setBusy('regenerate-options');
    setNotice(null);
    try {
      applyRunResponse(world, (await regenerateSceneOptions(world.id, sceneId)).run);
    } catch (error) {
      setNoticeTone('error');
      setNotice(error instanceof Error ? error.message : t('dashboard.optionsRegenerationFailed'));
    } finally {
      setBusy(null);
    }
  };

  const deleteVersion = async (versionId: string) => {
    if (!world || busy !== null) return false;
    setBusy('delete-version');
    setNotice(null);
    try {
      const response = await deleteRunVersion(world.id, versionId);
      replaceRun(response.run);
      setNoticeTone('success');
      setNotice(t('versions.deleted'));
      return true;
    } catch (error) {
      setNoticeTone('error');
      setNotice(error instanceof Error ? error.message : t('versions.deleteFailed'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const deleteBranch = async (sceneId: string) => {
    if (!world || busy !== null) return null;
    setBusy('delete-branch');
    setNotice(null);
    try {
      const response = await deleteSceneBranch(world.id, sceneId);
      replaceRun(response.run);
      setNoticeTone('success');
      setNotice(t('dashboard.sceneDeleted'));
      return response.run;
    } catch (error) {
      setNoticeTone('error');
      setNotice(error instanceof Error ? error.message : t('dashboard.sceneDeleteFailed'));
      return null;
    } finally {
      setBusy(null);
    }
  };

  const openSettings = () => {
    setCreateProjectOpen(false);
    setModelSettingsCapability(null);
    setSettingsOpen(true);
    setNotice(null);
  };

  const openWorkspace = () => {
    setSettingsOpen(false);
    setNotice(null);
  };

  const dismissNotice = useCallback(() => {
    setNotice(null);
  }, []);

  useEffect(() => {
    if (!notice) {
      dismissToast(WORKSPACE_NOTICE_TOAST_ID);
      return;
    }

    const showToast =
      noticeTone === 'success' ? successToast : noticeTone === 'error' ? errorToast : warningToast;
    showToast(notice, {
      id: WORKSPACE_NOTICE_TOAST_ID,
      onAutoClose: dismissNotice,
      onDismiss: dismissNotice,
    });
  }, [dismissNotice, notice, noticeTone]);

  const selectProject = async (project: ProjectRecord) => {
    if (busy !== null) return;
    if (project.id === activeProjectId) {
      openWorkspace();
      return;
    }
    if (world && isDirty) {
      setNoticeTone('warning');
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
      setNoticeTone('error');
      setNotice(error instanceof Error ? error.message : t('dashboard.projectLoadFailed'));
    } finally {
      setBusy(null);
    }
  };

  const showEmptyState = !settingsOpen && !loading && !world;
  const activeProject = projects.find((project) => project.id === activeProjectId);

  const updateProjectIcon = (icon: string | undefined) => {
    if (!activeProjectId) return;
    setProjects((current) => {
      const nextProjects = current.map((project) =>
        project.id === activeProjectId ? { ...project, icon } : project,
      );
      saveProjects(nextProjects);
      return nextProjects;
    });
  };

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
          onProjectDelete={setProjectToDelete}
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
              previewRef={previewRef}
              onGenerationChange={(changes) => void saveRunGeneration(changes)}
              onOpenModelSettings={setModelSettingsCapability}
              onAction={(action) => void perform(action)}
              onActivateScene={(sceneId) => void activateSceneForView(sceneId)}
              onOptionSelect={(sceneId, optionId) => void chooseOption(sceneId, optionId)}
              onInputSubmit={(sceneId, input) => void submitUserInteraction(sceneId, input)}
              onRegenerateOptions={(sceneId) => void regenerateOptions(sceneId)}
              onDeleteSceneBranch={deleteBranch}
              onDeleteVersion={deleteVersion}
              onRefresh={refreshRun}
              onSave={saveWorldConfig}
              projectIcon={activeProject?.icon}
              onProjectIconChange={updateProjectIcon}
              onRequestDeleteProject={() => {
                if (activeProject) setProjectToDelete(activeProject);
              }}
            />
          ) : (
            <>
              <SidebarToggle placement="floating" />
              <SidebarTrigger
                className="pointer-events-auto absolute left-3 top-3 z-30 md:hidden"
                title={t('common.openSidebar')}
                aria-label={t('common.openSidebar')}
              />
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
      <ModelSettingsDialog
        open={modelSettingsCapability !== null}
        defaultCapability={modelSettingsCapability ?? 'vision'}
        settings={providerSettings}
        loading={settingsLoading}
        busy={settingsBusy}
        onOpenChange={(open) => {
          if (!open) setModelSettingsCapability(null);
        }}
        onSave={saveProviderSettings}
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
      {projectToDelete ? (
        <DeleteProjectDialog
          project={projectToDelete}
          busy={busy === 'delete-project'}
          onOpenChange={(open) => {
            if (!open) setProjectToDelete(null);
          }}
          onDelete={removeProject}
        />
      ) : null}
    </PageShell>
  );
}

function worldToConfig(world: WorldSnapshot): WorldConfig {
  return {
    interactionType: world.interactionType,
    name: world.name,
    prompt: world.prompt,
    generation: world.generation,
  };
}

function activeVersionGeneration(run: RunSnapshot) {
  return run.versions.find((version) => version.id === run.id)?.generation ?? null;
}

function isLiveRunState(state: RunSnapshot['state'] | null) {
  return state === 'preparing' || state === 'running' || state === 'stopping';
}

export default WorldConsole;
