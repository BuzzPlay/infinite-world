import type {
  InteractionType,
  SceneOptionSnapshot,
  SceneSnapshot,
} from '@infinite-world/api-contract';
import { Folder, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '../../i18n/use-translation';
import { Button } from '../ui/button';
import { BranchChoicePanel } from './branch-choice-panel';
import { InteractiveRegionOverlay } from './interactive-region-overlay';

interface ReplayPanelProps {
  scenes: SceneSnapshot[];
  initialSceneId: string | null;
  interactionType: InteractionType;
}

interface ReplayPath {
  id: string;
  scenes: SceneSnapshot[];
}

interface ReplayChoice {
  options: SceneOptionSnapshot[];
  optionId: string | null;
}

export function ReplayPanel({ scenes, initialSceneId, interactionType }: ReplayPanelProps) {
  const { t } = useTranslation();
  const imageReplay = interactionType === 'image';
  const paths = useMemo(() => buildReplayPaths(scenes), [scenes]);
  const initialPath = paths.find((path) =>
    path.scenes.some((scene) => scene.id === initialSceneId),
  );
  const [selectedPathId, setSelectedPathId] = useState<string | null>(initialPath?.id ?? null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [pathsOpen, setPathsOpen] = useState(false);
  const [showSelectedOption, setShowSelectedOption] = useState(false);
  const [loopPlayback, setLoopPlayback] = useState(false);
  const [transitionChoice, setTransitionChoice] = useState<ReplayChoice | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const transitionChoiceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (transitionChoiceTimer.current) clearTimeout(transitionChoiceTimer.current);
    },
    [],
  );

  const selectedPath = paths.find((path) => path.id === selectedPathId) ?? paths[0] ?? null;
  const selectedScene = selectedPath?.scenes[sceneIndex] ?? null;
  const selectedSceneId = selectedScene?.id ?? null;
  const selectedSceneMediaType = selectedScene?.mediaType ?? 'none';
  const regions = selectedScene?.interactiveRegions ?? [];
  const selectedRegion = regions.find((region) => region.id === selectedRegionId) ?? null;
  const imageReplayOptions =
    selectedScene && selectedRegion
      ? selectedScene.options.filter((option) => option.regionId === selectedRegion.id)
      : [];
  const unavailableImageReplayOptionIds = imageReplayOptions
    .filter((option) => findSceneForOption(scenes, selectedScene?.id ?? '', option.id) === null)
    .map((option) => option.id);

  const chooseImageOption = useCallback(
    (option: SceneOptionSnapshot) => {
      if (!selectedScene) return;
      const childScene = findSceneForOption(scenes, selectedScene.id, option.id);
      if (!childScene) return;

      const nextPath = paths.find((path) => {
        const childIndex = path.scenes.findIndex((scene) => scene.id === childScene.id);
        return childIndex > 0 && path.scenes[childIndex - 1]?.id === selectedScene.id;
      });
      if (!nextPath) return;

      const nextSceneIndex = nextPath.scenes.findIndex((scene) => scene.id === childScene.id);
      if (nextSceneIndex < 0) return;

      setTransitionChoice(null);
      setSelectedPathId(nextPath.id);
      setSceneIndex(nextSceneIndex);
      setSelectedRegionId(null);
      setVideoEnded(false);
    },
    [paths, scenes, selectedScene],
  );

  useEffect(() => {
    if (selectedPath && selectedPath.id === selectedPathId) return;
    setSelectedPathId(initialPath?.id ?? paths[0]?.id ?? null);
    setSceneIndex(0);
    setShowSelectedOption(false);
  }, [initialPath?.id, paths, selectedPath, selectedPathId]);

  useEffect(() => {
    if (selectedPath && sceneIndex < selectedPath.scenes.length) return;
    setSceneIndex(0);
    setShowSelectedOption(false);
  }, [sceneIndex, selectedPath]);

  useEffect(() => {
    if (selectedSceneId === null) return;
    setSelectedRegionId(null);
    setVideoEnded(!imageReplay || selectedSceneMediaType !== 'video');
  }, [imageReplay, selectedSceneId, selectedSceneMediaType]);

  if (!selectedPath || !selectedScene) {
    return (
      <div className="grid h-full min-h-[100dvh] place-items-center bg-background px-6 text-sm text-muted-foreground">
        {t('dashboard.replayEmpty')}
      </div>
    );
  }

  const nextScene = selectedPath.scenes[sceneIndex + 1] ?? null;
  const selectedOptionId = nextScene?.sourceOptionId ?? null;
  const isLastScene = sceneIndex === selectedPath.scenes.length - 1;
  const showImageChoices = imageReplay && videoEnded && selectedRegion !== null;

  const choosePath = (path: ReplayPath) => {
    if (transitionChoiceTimer.current) clearTimeout(transitionChoiceTimer.current);
    setTransitionChoice(null);
    setSelectedPathId(path.id);
    setSceneIndex(0);
    setShowSelectedOption(false);
    setPathsOpen(false);
  };

  const selectImageRegion = (regionId: string) => {
    setSelectedRegionId(regionId);
  };

  return (
    <div
      className="relative h-full min-h-[100dvh] w-full overflow-hidden bg-background text-foreground"
      onPointerDownCapture={(event) => {
        if (!imageReplay || selectedRegionId === null) return;
        if (event.target instanceof Element && event.target.closest('[data-choice-panel]')) return;
        setSelectedRegionId(null);
      }}
    >
      {selectedScene.previewUrl && selectedScene.mediaType === 'video' ? (
        imageReplay ? (
          <ImageReplayVideo
            scene={selectedScene}
            sceneLabel={t('dashboard.scene', { sequence: selectedScene.sequence })}
            onEnded={() => setVideoEnded(true)}
          />
        ) : (
          <ReplayVideo
            scene={selectedScene}
            nextScene={nextScene}
            onAdvance={() => {
              if (!isLastScene) {
                setTransitionChoice({
                  options: selectedScene.options,
                  optionId: selectedOptionId,
                });
                setShowSelectedOption(false);
                setSceneIndex((current) => current + 1);
                transitionChoiceTimer.current = setTimeout(() => {
                  setTransitionChoice(null);
                  transitionChoiceTimer.current = null;
                }, 700);
              }
            }}
            onNearEnd={() => setShowSelectedOption(true)}
            loop={loopPlayback}
            onLoop={() => {
              setShowSelectedOption(false);
              setSceneIndex(0);
            }}
            sceneLabel={t('dashboard.scene', { sequence: selectedScene.sequence })}
          />
        )
      ) : selectedScene.previewUrl ? (
        // biome-ignore lint/performance/noImgElement: Generated media uses arbitrary provider URLs.
        <img
          className="absolute inset-0 size-full object-cover"
          src={selectedScene.previewUrl}
          alt={t('dashboard.scene', { sequence: selectedScene.sequence })}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
          {t('dashboard.noReplayMedia')}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-black/10" aria-hidden="true" />

      {imageReplay && videoEnded && regions.length > 0 ? (
        <InteractiveRegionOverlay
          regions={regions}
          selectedRegionId={selectedRegionId}
          disabled={false}
          onSelect={selectImageRegion}
        />
      ) : null}

      <div className="absolute right-4 top-3 z-20 flex items-center gap-1 sm:right-6">
        <Button
          type="button"
          size="icon-md"
          variant="outline"
          className="border-border/80 bg-background/90 shadow-sm backdrop-blur-md"
          title={pathsOpen ? t('dashboard.closeReplayPaths') : t('dashboard.openReplayPaths')}
          aria-label={pathsOpen ? t('dashboard.closeReplayPaths') : t('dashboard.openReplayPaths')}
          onClick={() => setPathsOpen((open) => !open)}
        >
          {pathsOpen ? <X size={17} aria-hidden="true" /> : <Folder size={17} aria-hidden="true" />}
        </Button>
      </div>

      {!imageReplay || showImageChoices ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-4 z-10 flex justify-center sm:inset-x-6 sm:bottom-6">
          <BranchChoicePanel
            options={
              imageReplay
                ? imageReplayOptions
                : (transitionChoice?.options ?? selectedScene.options)
            }
            selectedOptionId={
              imageReplay
                ? null
                : (transitionChoice?.optionId ?? (showSelectedOption ? selectedOptionId : null))
            }
            unavailableOptionIds={imageReplay ? unavailableImageReplayOptionIds : undefined}
            onSelect={
              imageReplay
                ? (option) => {
                    chooseImageOption(option);
                  }
                : undefined
            }
            loopEnabled={loopPlayback}
            onLoopToggle={imageReplay ? undefined : () => setLoopPlayback((enabled) => !enabled)}
          />
        </div>
      ) : null}

      {pathsOpen ? (
        <aside className="absolute inset-y-3 right-3 z-30 flex w-[min(21rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-background/95 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium">{t('dashboard.replayPaths')}</h2>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              title={t('dashboard.closeReplayPaths')}
              aria-label={t('dashboard.closeReplayPaths')}
              onClick={() => setPathsOpen(false)}
            >
              <X size={16} aria-hidden="true" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="grid gap-2">
              {paths.map((path, index) => (
                <Button
                  key={path.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    'h-auto justify-start px-3 py-3 text-left',
                    path.id === selectedPath.id &&
                      'border-brand-blue bg-brand-blue/5 ring-1 ring-brand-blue/30',
                  )}
                  onClick={() => choosePath(path)}
                >
                  <span className="grid min-w-0 gap-1">
                    <span className="text-xs font-medium">
                      {t('dashboard.replayPathNumber', { number: index + 1 })}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {path.scenes
                        .map((scene) => t('dashboard.scene', { sequence: scene.sequence }))
                        .join('  →  ')}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

interface ReplayVideoProps {
  scene: SceneSnapshot;
  nextScene: SceneSnapshot | null;
  onAdvance: () => void;
  onNearEnd: () => void;
  loop: boolean;
  onLoop: () => void;
  sceneLabel: string;
}

function ReplayVideo({
  scene,
  nextScene,
  onAdvance,
  onNearEnd,
  loop,
  onLoop,
  sceneLabel,
}: ReplayVideoProps) {
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const crossfadeStartedRef = useRef(false);
  const [activeScene, setActiveScene] = useState(scene);
  const [queuedScene, setQueuedScene] = useState<SceneSnapshot | null>(nextScene);
  const [nextReady, setNextReady] = useState(false);
  const [crossfading, setCrossfading] = useState(false);
  const [advancePending, setAdvancePending] = useState(false);
  const nearEndStartedRef = useRef(false);

  useEffect(() => {
    if (scene.id === activeScene.id) {
      setQueuedScene(nextScene);
      return;
    }

    if (scene.id === queuedScene?.id) {
      setActiveScene(scene);
      setQueuedScene(nextScene);
    } else {
      setActiveScene(scene);
      setQueuedScene(nextScene);
    }
    crossfadeStartedRef.current = false;
    setNextReady(false);
    setCrossfading(false);
    setAdvancePending(false);
    nearEndStartedRef.current = false;
  }, [activeScene, nextScene, queuedScene, scene]);

  useEffect(() => {
    if (!crossfading) return;
    const timer = window.setTimeout(onAdvance, 280);
    return () => window.clearTimeout(timer);
  }, [crossfading, onAdvance]);

  const startCrossfade = () => {
    if (crossfadeStartedRef.current) return;
    crossfadeStartedRef.current = true;
    if (queuedScene?.mediaType === 'video') void nextVideoRef.current?.play();
    setCrossfading(true);
  };

  const advance = () => {
    if (!queuedScene) {
      if (loop) onLoop();
      return;
    }
    if (crossfadeStartedRef.current) return;
    if (queuedScene.mediaType === 'video' && !nextReady) {
      setAdvancePending(true);
      return;
    }
    startCrossfade();
  };

  const handleNextReady = () => {
    setNextReady(true);
    if (!advancePending) return;
    startCrossfade();
  };

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (queuedScene && !nearEndStartedRef.current && video.duration - video.currentTime <= 3) {
      nearEndStartedRef.current = true;
      onNearEnd();
    }
    if (queuedScene?.mediaType !== 'video' || !nextReady) return;
    if (video.duration - video.currentTime <= 0.35) startCrossfade();
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      {/* biome-ignore lint/a11y/useMediaCaption: Generated videos do not provide caption tracks. */}
      <video
        key={activeScene.id}
        className={cn(
          'absolute inset-0 size-full object-cover transition-opacity duration-300',
          crossfading && 'opacity-0',
        )}
        src={activeScene.previewUrl}
        autoPlay
        controls={false}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={advance}
        aria-label={sceneLabel}
      />
      {queuedScene?.previewUrl && queuedScene.mediaType === 'video' ? (
        <video
          ref={nextVideoRef}
          key={queuedScene.id}
          className={cn(
            'pointer-events-none absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300',
            crossfading && 'opacity-100',
          )}
          src={queuedScene.previewUrl}
          controls={false}
          muted
          playsInline
          preload="auto"
          onCanPlay={handleNextReady}
          onError={onAdvance}
        />
      ) : null}
    </div>
  );
}

function ImageReplayVideo({
  scene,
  sceneLabel,
  onEnded,
}: {
  scene: SceneSnapshot;
  sceneLabel: string;
  onEnded: () => void;
}) {
  const activeVideoRef = useRef<HTMLVideoElement>(null);
  const incomingVideoRef = useRef<HTMLVideoElement>(null);
  const startedSceneIdRef = useRef<string | null>(null);
  const [displayedScene, setDisplayedScene] = useState(scene);
  const [incomingScene, setIncomingScene] = useState<SceneSnapshot | null>(null);
  const [incomingReady, setIncomingReady] = useState(false);

  useEffect(() => {
    if (scene.id === displayedScene.id) return;
    setIncomingScene(scene);
    setIncomingReady(false);
  }, [displayedScene.id, scene]);

  useEffect(() => {
    if (!incomingReady || !incomingScene) return;
    const timer = window.setTimeout(() => {
      setDisplayedScene(incomingScene);
      setIncomingScene(null);
      setIncomingReady(false);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [incomingReady, incomingScene]);

  const handleIncomingReady = () => {
    const video = incomingVideoRef.current;
    if (!video || incomingReady) return;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
    setIncomingReady(true);
  };

  const handleActiveReady = () => {
    const video = activeVideoRef.current;
    if (!video || startedSceneIdRef.current === displayedScene.id) return;
    startedSceneIdRef.current = displayedScene.id;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      <video
        ref={activeVideoRef}
        key={displayedScene.id}
        className={cn(
          'absolute inset-0 size-full object-cover transition-opacity duration-300',
          incomingReady && 'opacity-0',
        )}
        src={displayedScene.previewUrl}
        autoPlay
        controls={false}
        muted
        playsInline
        preload="auto"
        onLoadedData={handleActiveReady}
        onEnded={() => {
          if (!incomingScene) onEnded();
        }}
        aria-label={sceneLabel}
      />
      {incomingScene ? (
        <video
          ref={incomingVideoRef}
          key={incomingScene.id}
          className={cn(
            'pointer-events-none absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300',
            incomingReady && 'opacity-100',
          )}
          src={incomingScene.previewUrl}
          controls={false}
          muted
          playsInline
          preload="auto"
          onCanPlay={handleIncomingReady}
          aria-label={sceneLabel}
        />
      ) : null}
    </div>
  );
}

function findSceneForOption(scenes: SceneSnapshot[], parentSceneId: string, optionId: string) {
  return (
    scenes.find(
      (scene) => scene.parentSceneId === parentSceneId && scene.sourceOptionId === optionId,
    ) ?? null
  );
}

function buildReplayPaths(scenes: SceneSnapshot[]): ReplayPath[] {
  const ordered = [...scenes].sort((left, right) => left.sequence - right.sequence);
  const children = new Map<string, SceneSnapshot[]>();
  for (const scene of ordered) {
    if (!scene.parentSceneId) continue;
    const current = children.get(scene.parentSceneId) ?? [];
    current.push(scene);
    children.set(scene.parentSceneId, current);
  }

  const paths: ReplayPath[] = [];
  const visit = (scene: SceneSnapshot, path: SceneSnapshot[]) => {
    const next = children.get(scene.id) ?? [];
    if (!next.length) {
      paths.push({ id: path.map((item) => item.id).join(':'), scenes: path });
      return;
    }
    for (const child of next) visit(child, [...path, child]);
  };

  for (const root of ordered.filter((scene) => !scene.parentSceneId)) visit(root, [root]);
  return paths;
}
