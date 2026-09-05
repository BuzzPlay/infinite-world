import type {
  GenerationSettings,
  InteractionType,
  RunState,
  SceneSnapshot,
} from '@infinite-world/api-contract';
import type { ModelCapability } from '@infinite-world/api-contract/model-catalog';
import { History, Maximize2, Play, Square, Waypoints } from 'lucide-react';
import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '../../i18n/use-translation';
import { Button } from '../ui/button';
import { BranchChoicePanel } from './branch-choice-panel';
import { InteractionInputPanel } from './interaction-input-panel';
import type { GenerationModelOption } from './model-options';
import { RecentVersionsPanel } from './recent-versions-panel';
import { RunModelControls } from './run-model-controls';
import type { SceneVersionSummary } from './scene-version-data';

export type RunAction = 'start' | 'stop' | 'restart';

interface PreviewCanvasProps {
  currentScene: SceneSnapshot | null;
  state: RunState;
  isRunning: boolean;
  isActive: boolean;
  busy: string | null;
  loading: boolean;
  previewRef: RefObject<HTMLDivElement>;
  selectedOptionId: string | null;
  generatingChoice: boolean;
  canOpenBranchCanvas: boolean;
  canOpenVersions: boolean;
  onOptionSelect: (sceneId: string, optionId: string) => void;
  interactionType?: InteractionType;
  onInputSubmit?: (sceneId: string, input: string) => void;
  onRegenerateOptions?: (sceneId: string) => void;
  onOpenBranchCanvas: () => void;
  onOpenVersions: () => void;
  recentVersions?: SceneVersionSummary[];
  onSelectVersion?: (sceneId: string) => void;
  onStop: () => void;
  onAction: (action: RunAction) => void;
  showRunCta?: boolean;
  autoResetKey?: string;
  runModels?: RunModelControlsConfig;
}

interface RunModelControlsConfig {
  generation: GenerationSettings;
  visionModelOptions: GenerationModelOption[];
  videoModelOptions: GenerationModelOption[];
  disabled: boolean;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
  onOpenRunSettings: () => void;
  onOpenModelSettings: (capability: ModelCapability) => void;
}

export function PreviewCanvas({
  currentScene,
  state,
  isRunning,
  isActive,
  busy,
  loading,
  previewRef,
  selectedOptionId,
  generatingChoice,
  canOpenBranchCanvas,
  canOpenVersions,
  onOptionSelect,
  interactionType,
  onInputSubmit,
  onRegenerateOptions,
  onOpenBranchCanvas,
  onOpenVersions,
  recentVersions = [],
  onSelectVersion,
  onStop,
  onAction,
  showRunCta = true,
  autoResetKey = 'initial',
  runModels,
}: PreviewCanvasProps) {
  const { t } = useTranslation();
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
  const autoAdvanceRef = useRef(false);
  const autoCountdownRef = useRef<number | null>(null);
  const currentSceneRef = useRef(currentScene);
  const onOptionSelectRef = useRef(onOptionSelect);
  const lastMediaSceneRef = useRef<SceneSnapshot | null>(null);
  const resetStateRef = useRef({
    sceneId: currentScene?.id ?? null,
    viewInteraction: autoResetKey,
  });
  const currentSceneId = currentScene?.id ?? null;
  currentSceneRef.current = currentScene;
  onOptionSelectRef.current = onOptionSelect;
  const previewUrl = currentScene?.previewUrl.trim() ?? '';
  const mediaScene = currentScene && previewUrl ? currentScene : null;
  if (mediaScene) lastMediaSceneRef.current = mediaScene;
  const displayedMediaScene = mediaScene ?? (isRunning ? lastMediaSceneRef.current : null);
  const hasMedia = displayedMediaScene !== null;
  const playbackActive = isActive;
  const showRunButton = showRunCta && !playbackActive;
  const showGenerating = isRunning && !hasMedia;
  const showBranchChoices = interactionType !== 'voice-text' && hasMedia && currentScene !== null;
  const hasBranchChoices = Boolean(currentScene?.options.length);
  const disableSceneNavigation = busy !== null || showGenerating || generatingChoice;
  const clearAutoCountdown = useCallback(() => {
    autoCountdownRef.current = null;
    setAutoCountdown(null);
  }, []);
  const disableAuto = useCallback(() => {
    autoAdvanceRef.current = false;
    setAutoEnabled(false);
    clearAutoCountdown();
  }, [clearAutoCountdown]);

  useEffect(() => {
    const sceneChanged = resetStateRef.current.sceneId !== currentSceneId;
    const viewChanged = resetStateRef.current.viewInteraction !== autoResetKey;
    resetStateRef.current = { sceneId: currentSceneId, viewInteraction: autoResetKey };
    if (autoAdvanceRef.current && sceneChanged && !viewChanged) {
      if (currentSceneId !== null) autoAdvanceRef.current = false;
      return;
    }
    autoAdvanceRef.current = false;
    disableAuto();
  }, [autoResetKey, currentSceneId, disableAuto]);

  useEffect(() => {
    if (state === 'failed') {
      disableAuto();
      return;
    }
    if (!hasBranchChoices) {
      disableAuto();
      return;
    }
    if (
      !autoEnabled ||
      !showBranchChoices ||
      generatingChoice ||
      busy !== null ||
      currentSceneId === null
    ) {
      clearAutoCountdown();
      return;
    }

    autoCountdownRef.current = 5;
    setAutoCountdown(5);
    const timer = window.setInterval(() => {
      const current = autoCountdownRef.current;
      if (current === null) return;
      if (current > 1) {
        const next = current - 1;
        autoCountdownRef.current = next;
        setAutoCountdown(next);
        return;
      }

      autoCountdownRef.current = null;
      setAutoCountdown(null);
      const scene = currentSceneRef.current;
      const options = scene?.options ?? [];
      const option = options[Math.floor(Math.random() * options.length)];
      if (scene && option) {
        autoAdvanceRef.current = true;
        onOptionSelectRef.current(scene.id, option.id);
      }
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [
    autoEnabled,
    busy,
    clearAutoCountdown,
    currentSceneId,
    disableAuto,
    generatingChoice,
    hasBranchChoices,
    showBranchChoices,
    state,
  ]);

  const toggleAuto = () => {
    if (autoEnabled) {
      disableAuto();
      return;
    }
    setAutoEnabled(true);
  };

  const selectOption = (sceneId: string, optionId: string) => {
    disableAuto();
    onOptionSelect(sceneId, optionId);
  };

  return (
    <div
      className={cn(
        'relative h-full min-h-[100dvh] w-full overflow-hidden',
        hasMedia ? 'bg-neutral-950 text-white' : 'bg-background text-foreground',
      )}
      ref={previewRef}
    >
      {hasMedia ? (
        displayedMediaScene?.mediaType === 'video' ? (
          <PreviewVideo
            scene={displayedMediaScene}
            sceneLabel={t('dashboard.scene', { sequence: displayedMediaScene.sequence })}
          />
        ) : (
          // biome-ignore lint/performance/noImgElement: Generated media can use arbitrary provider URLs.
          <img
            className="absolute inset-0 size-full object-cover"
            src={displayedMediaScene?.previewUrl}
            alt={t('dashboard.scene', { sequence: displayedMediaScene?.sequence ?? 0 })}
          />
        )
      ) : (
        <div className="absolute inset-0 bg-background" aria-hidden="true" />
      )}
      {hasMedia ? (
        <div className="pointer-events-none absolute inset-0 bg-black/15" aria-hidden="true" />
      ) : null}

      {showRunButton ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 pb-28">
          <div className="grid w-full max-w-7xl grid-cols-1 items-start justify-items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-8 md:gap-y-6">
            <Button
              className="md:col-start-2 md:row-start-1"
              size="lg"
              variant="default"
              onClick={() => onAction('start')}
              disabled={busy !== null || loading}
            >
              <Play size={16} aria-hidden="true" /> Run
            </Button>
            <div className="md:col-span-3 md:row-start-2 md:justify-self-center">
              {onSelectVersion ? (
                <RecentVersionsPanel versions={recentVersions} onSelectVersion={onSelectVersion} />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showGenerating ? (
        <div
          className="absolute inset-0 grid place-items-center px-6 text-center text-foreground"
          role="status"
          aria-live="polite"
        >
          <div className="grid justify-items-center gap-4">
            <div className="grid size-16 place-items-center" aria-hidden="true">
              {/* biome-ignore lint/performance/noImgElement: The existing local logo is a static UI asset. */}
              <img className="world-building-logo size-14 object-contain" src="/logo.svg" alt="" />
            </div>
            <span className="text-sm text-muted-foreground">
              {t('dashboard.buildingWorld')}
              <span
                className="world-building-dots inline-block w-[1.5em] text-left"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          'absolute right-4 top-3 z-10 flex items-center gap-1 rounded-lg border p-1 sm:right-6',
          hasMedia
            ? 'border-white/15 bg-black/35 text-white backdrop-blur-md'
            : 'border-border bg-card/90 text-foreground shadow-sm',
        )}
      >
        {playbackActive ? (
          <Button
            size="icon-sm"
            variant="ghost"
            className={hasMedia ? 'text-white hover:bg-white/15 hover:text-white' : undefined}
            title={state === 'stopping' ? t('dashboard.stopping') : t('dashboard.stopPreview')}
            aria-label={state === 'stopping' ? t('dashboard.stopping') : t('dashboard.stopPreview')}
            onClick={() => {
              disableAuto();
              onStop();
            }}
            disabled={busy !== null || state === 'stopping'}
          >
            <Square size={14} aria-hidden="true" />
          </Button>
        ) : null}
        <Button
          size="icon-sm"
          variant="ghost"
          className={hasMedia ? 'text-white hover:bg-white/15 hover:text-white' : undefined}
          title={t('versions.open')}
          aria-label={t('versions.open')}
          onClick={() => {
            disableAuto();
            onOpenVersions();
          }}
          disabled={disableSceneNavigation || !canOpenVersions}
        >
          <History size={14} aria-hidden="true" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className={hasMedia ? 'text-white hover:bg-white/15 hover:text-white' : undefined}
          title={t('dashboard.openBranchCanvas')}
          aria-label={t('dashboard.openBranchCanvas')}
          onClick={() => {
            disableAuto();
            onOpenBranchCanvas();
          }}
          disabled={disableSceneNavigation || !canOpenBranchCanvas}
        >
          <Waypoints size={14} aria-hidden="true" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className={hasMedia ? 'text-white hover:bg-white/15 hover:text-white' : undefined}
          title={t('dashboard.fullscreenPreview')}
          aria-label={t('dashboard.fullscreenPreview')}
          onClick={() => {
            disableAuto();
            void previewRef.current?.requestFullscreen?.();
          }}
        >
          <Maximize2 size={14} aria-hidden="true" />
        </Button>
      </div>

      <RunModelControlsOverlay
        hidden={playbackActive}
        config={runModels}
        onInteraction={disableAuto}
      />

      <div
        className={cn(
          cn(
            'pointer-events-none absolute inset-x-3 z-10 flex justify-center sm:inset-x-6',
            interactionType === 'voice-text' ? 'bottom-28 sm:bottom-32' : 'bottom-4 sm:bottom-6',
          ),
          !showBranchChoices && 'hidden',
        )}
      >
        <BranchChoicePanel
          options={currentScene?.options ?? []}
          selectedOptionId={selectedOptionId}
          disabled={busy !== null || generatingChoice}
          generating={generatingChoice}
          regenerating={busy === 'regenerate-options'}
          autoEnabled={autoEnabled}
          autoCountdown={autoCountdown}
          onAutoToggle={toggleAuto}
          onSelect={(option) => currentScene && selectOption(currentScene.id, option.id)}
          onRegenerate={
            currentScene && onRegenerateOptions
              ? () => {
                  disableAuto();
                  onRegenerateOptions(currentScene.id);
                }
              : undefined
          }
        />
      </div>
      {hasMedia && currentScene ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-4 z-10 flex justify-center sm:inset-x-6 sm:bottom-6">
          <InteractionInputPanel
            interactionType={interactionType ?? 'text'}
            disabled={busy !== null || !playbackActive}
            onSubmit={(input) => onInputSubmit?.(currentScene.id, input)}
          />
        </div>
      ) : null}
    </div>
  );
}

function PreviewVideo({ scene, sceneLabel }: { scene: SceneSnapshot; sceneLabel: string }) {
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const [activeScene, setActiveScene] = useState(scene);
  const [queuedScene, setQueuedScene] = useState<SceneSnapshot | null>(null);
  const [crossfading, setCrossfading] = useState(false);

  useEffect(() => {
    if (scene.id === activeScene.id) return;
    setQueuedScene(scene);
    setCrossfading(false);
  }, [activeScene.id, scene]);

  useEffect(() => {
    if (!crossfading || !queuedScene) return;
    const timer = window.setTimeout(() => {
      setActiveScene(queuedScene);
      setQueuedScene(null);
      setCrossfading(false);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [crossfading, queuedScene]);

  const startTransition = () => {
    if (!queuedScene || crossfading) return;
    void nextVideoRef.current?.play();
    setCrossfading(true);
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-neutral-950">
      <video
        key={activeScene.id}
        className={cn(
          'absolute inset-0 size-full object-cover transition-opacity duration-300',
          crossfading && 'opacity-0',
        )}
        src={activeScene.previewUrl}
        autoPlay
        muted
        loop
        playsInline
        controls={false}
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
          autoPlay
          muted
          loop
          playsInline
          controls={false}
          preload="auto"
          onCanPlay={startTransition}
          onError={() => {
            setActiveScene(queuedScene);
            setQueuedScene(null);
            setCrossfading(false);
          }}
          aria-label={sceneLabel}
        />
      ) : null}
    </div>
  );
}

function RunModelControlsOverlay({
  hidden,
  config,
  onInteraction,
}: {
  hidden: boolean;
  config?: RunModelControlsConfig;
  onInteraction: () => void;
}) {
  if (hidden || !config) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4 sm:bottom-6 sm:px-6">
      <div className="pointer-events-auto w-full max-w-2xl">
        <RunModelControls {...config} onInteraction={onInteraction} />
      </div>
    </div>
  );
}
