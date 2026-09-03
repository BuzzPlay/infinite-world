import type { RefObject } from 'react';
import { Maximize2, Play, RefreshCw, Square } from 'lucide-react';
import type { RunState, SceneSnapshot } from '@infinite-world/api-contract';

import { BranchChoicePanel } from './branch-choice-panel';
import { Button } from '../ui/button';
import { Loading } from '../ui/loading';
import { cn } from '@/lib/utils';

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
}: PreviewCanvasProps) {
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
            aria-label={`Scene ${mediaScene.sequence}`}
          />
        ) : (
          <img
            className="absolute inset-0 size-full object-cover"
            src={previewUrl}
            alt={`Scene ${mediaScene.sequence}`}
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
            <span className="text-sm text-muted-foreground">Preparing preview</span>
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
            title={state === 'stopping' ? 'Stopping' : 'Stop preview'}
            aria-label={state === 'stopping' ? 'Stopping' : 'Stop preview'}
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
            title="Start preview"
            aria-label="Start preview"
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
          title="Restart preview"
          aria-label="Restart preview"
          onClick={() => onAction('restart')}
          disabled={busy !== null || !canRestart}
        >
          <RefreshCw size={14} aria-hidden="true" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className={hasMedia ? 'text-white hover:bg-white/15 hover:text-white' : undefined}
          title="Fullscreen preview"
          aria-label="Fullscreen preview"
          onClick={() => void previewRef.current?.requestFullscreen?.()}
        >
          <Maximize2 size={14} aria-hidden="true" />
        </Button>
      </div>

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
