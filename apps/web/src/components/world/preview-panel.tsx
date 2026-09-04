import type { RefObject } from 'react';
import { Maximize2, Play, RefreshCw, Square } from 'lucide-react';
import type { GenerationSettings, RunState, SceneSnapshot } from '@infinite-world/api-contract';

import { BranchChoicePanel } from './branch-choice-panel';
import { Button } from '../ui/button';
import { Loading } from '../ui/loading';
import { cn } from '@/lib/utils';
import { useTranslation } from '../../i18n/use-translation';
import type { GenerationModelOption } from './model-options';
import { RunModelControls } from './run-model-controls';

export type RunAction = 'start' | 'stop' | 'restart';

interface PreviewCanvasProps {
  currentScene: SceneSnapshot | null;
  state: RunState;
  isRunning: boolean;
  isActive: boolean;
  canRestart: boolean;
  busy: string | null;
  loading: boolean;
  previewRef: RefObject<HTMLDivElement>;
  selectedOptionId: string | null;
  onOptionSelect: (optionId: string) => void;
  onAction: (action: RunAction) => void;
  showRunCta?: boolean;
  runModels?: RunModelControlsConfig;
}

interface RunModelControlsConfig {
  generation: GenerationSettings;
  visionModelOptions: GenerationModelOption[];
  videoModelOptions: GenerationModelOption[];
  disabled: boolean;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
  onOpenSettings: () => void;
}

export function PreviewCanvas({
  currentScene,
  state,
  isRunning,
  isActive,
  canRestart,
  busy,
  loading,
  previewRef,
  selectedOptionId,
  onOptionSelect,
  onAction,
  showRunCta = true,
  runModels,
}: PreviewCanvasProps) {
  const { t } = useTranslation();
  const previewUrl = currentScene?.previewUrl.trim() ?? '';
  const mediaScene = currentScene && previewUrl ? currentScene : null;
  const hasMedia = mediaScene !== null;
  const showRunButton = showRunCta && !isActive && !hasMedia;
  const showGenerating = isRunning && !hasMedia;
  const showBranchChoices = isRunning && hasMedia;

  return (
    <div
      className={cn(
        'relative h-full min-h-[100dvh] w-full overflow-hidden',
        hasMedia ? 'bg-neutral-950 text-white' : 'bg-background text-foreground',
      )}
      ref={previewRef}
    >
      {hasMedia ? (
        mediaScene.mediaType === 'video' ? (
          <video
            className="absolute inset-0 size-full object-cover"
            src={previewUrl}
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            aria-label={t('dashboard.scene', { sequence: mediaScene.sequence })}
          />
        ) : (
          <img
            className="absolute inset-0 size-full object-cover"
            src={previewUrl}
            alt={t('dashboard.scene', { sequence: mediaScene.sequence })}
          />
        )
      ) : (
        <div className="absolute inset-0 bg-background" aria-hidden="true" />
      )}
      {hasMedia ? (
        <div className="pointer-events-none absolute inset-0 bg-black/15" aria-hidden="true" />
      ) : null}

      {showRunButton ? (
        <div className="absolute inset-0 grid place-items-center px-6">
          <Button
            size="lg"
            variant="default"
            onClick={() => onAction('start')}
            disabled={busy !== null || loading}
          >
            <Play size={16} aria-hidden="true" /> Run
          </Button>
        </div>
      ) : null}

      {showGenerating ? (
        <div className="absolute inset-0 grid place-items-center px-6 text-center text-foreground">
          <div className="grid justify-items-center gap-3">
            <Loading className="size-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('dashboard.preparingPreview')}</span>
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
        {isActive ? (
          <Button
            size="icon-sm"
            variant="ghost"
            className={hasMedia ? 'text-white hover:bg-white/15 hover:text-white' : undefined}
            title={state === 'stopping' ? t('dashboard.stopping') : t('dashboard.stopPreview')}
            aria-label={state === 'stopping' ? t('dashboard.stopping') : t('dashboard.stopPreview')}
            onClick={() => onAction('stop')}
            disabled={busy !== null || state === 'stopping'}
          >
            <Square size={14} aria-hidden="true" />
          </Button>
        ) : (
          <Button
            size="icon-sm"
            variant="ghost"
            className={hasMedia ? 'text-white hover:bg-white/15 hover:text-white' : undefined}
            title={t('dashboard.startPreview')}
            aria-label={t('dashboard.startPreview')}
            onClick={() => onAction('start')}
            disabled={busy !== null || loading}
          >
            <Play size={14} aria-hidden="true" />
          </Button>
        )}
        <Button
          size="icon-sm"
          variant="ghost"
          className={hasMedia ? 'text-white hover:bg-white/15 hover:text-white' : undefined}
          title={t('dashboard.restartPreview')}
          aria-label={t('dashboard.restartPreview')}
          onClick={() => onAction('restart')}
          disabled={busy !== null || !canRestart}
        >
          <RefreshCw size={14} aria-hidden="true" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className={hasMedia ? 'text-white hover:bg-white/15 hover:text-white' : undefined}
          title={t('dashboard.fullscreenPreview')}
          aria-label={t('dashboard.fullscreenPreview')}
          onClick={() => void previewRef.current?.requestFullscreen?.()}
        >
          <Maximize2 size={14} aria-hidden="true" />
        </Button>
      </div>

      <RunModelControlsOverlay isActive={isActive} config={runModels} />

      <div
        className={cn(
          'pointer-events-none absolute inset-x-3 bottom-4 z-10 flex justify-center sm:inset-x-6 sm:bottom-6',
          !showBranchChoices && 'hidden',
        )}
      >
        <BranchChoicePanel
          options={currentScene?.options ?? []}
          selectedOptionId={selectedOptionId}
          onSelect={(option) => onOptionSelect(option.id)}
        />
      </div>
    </div>
  );
}

function RunModelControlsOverlay({
  isActive,
  config,
}: {
  isActive: boolean;
  config?: RunModelControlsConfig;
}) {
  if (isActive || !config) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4 sm:bottom-6 sm:px-6">
      <div className="pointer-events-auto w-full max-w-xl">
        <RunModelControls {...config} />
      </div>
    </div>
  );
}
