import { useEffect, useRef, useState } from 'react';
import { Radio, Square, Volume2, VolumeX } from 'lucide-react';
import type { RefObject } from 'react';
import type { LiveOutputSnapshot, RunState, SceneSnapshot } from '@infinite-world/api-contract';

import { Button } from '../ui/button';
import { PreviewCanvas, type RunAction } from './preview-panel';
import { LiveRunDialog } from './live-run-dialog';
import { defaultLiveOutputSettings, type LiveOutputSettings } from './live-output-types';
import { connectBrowserStream, type BrowserStreamState } from '../../lib/browser-stream';
import { useTranslation } from '../../i18n/use-translation';

interface LiveOutputViewProps {
  worldId: string | null;
  outputMode: string | null;
  output: LiveOutputSnapshot | null;
  currentScene: SceneSnapshot | null;
  state: RunState;
  isRunning: boolean;
  isActive: boolean;
  canRestart: boolean;
  busy: string | null;
  loading: boolean;
  twitchStreamKeyConfigured: boolean;
  previewRef: RefObject<HTMLDivElement>;
  selectedOptionId: string | null;
  onOptionSelect: (optionId: string) => void;
  onAction: (action: RunAction, output?: LiveOutputSettings) => void;
}

export function LiveOutputView(props: LiveOutputViewProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settings, setSettings] = useState<LiveOutputSettings>(defaultLiveOutputSettings);
  const [streamState, setStreamState] = useState<BrowserStreamState>('closed');
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasMedia = Boolean(props.currentScene?.previewUrl.trim());
  const browserOutputActive =
    props.isActive && props.outputMode === 'webrtc' && props.worldId !== null;
  const outputActive = props.isActive && props.outputMode !== null;

  useEffect(() => {
    if (!props.output) return;
    setSettings((current) => ({
      ...current,
      mode: props.output?.mode ?? current.mode,
      platform: props.output?.platform ?? current.platform,
      endpoint: props.output?.endpoint || current.endpoint,
      title: props.output?.title || current.title,
    }));
  }, [props.output?.endpoint, props.output?.mode, props.output?.platform, props.output?.title]);

  useEffect(() => {
    if (!browserOutputActive || !props.worldId || !videoRef.current) {
      setStreamState('closed');
      return;
    }
    let active = true;
    let closeStream: (() => void) | null = null;
    setStreamState('connecting');
    void connectBrowserStream(props.worldId, videoRef.current, (state) => {
      if (active) setStreamState(state);
    })
      .then((connection) => {
        if (active) closeStream = connection.close;
        else connection.close();
      })
      .catch(() => {
        if (active) setStreamState('error');
      });
    return () => {
      active = false;
      closeStream?.();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [browserOutputActive, props.worldId]);

  return (
    <div className="relative h-full min-h-[100dvh] w-full overflow-hidden bg-background">
      <PreviewCanvas {...props} showRunCta={false} />
      {browserOutputActive ? (
        <video
          ref={videoRef}
          className={
            streamState === 'connected' ? 'absolute inset-0 z-[1] size-full object-cover' : 'hidden'
          }
          autoPlay
          muted={muted}
          playsInline
          controls={false}
          aria-label={t('dashboard.liveBrowserOutput')}
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center px-4">
        {outputActive ? (
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-white/20 bg-black/60 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
            <span className="grid size-8 place-items-center rounded-md bg-red-500/90">
              <Radio size={16} aria-hidden="true" />
            </span>
            <span className="grid gap-0.5">
              <strong className="text-sm font-medium">{t('dashboard.outputReady')}</strong>
              <span className="text-[11px] text-white/60">
                {t(`platform.${settings.platform}`)} ·{' '}
                {settings.title || t('common.untitledStream')}
              </span>
            </span>
            <Button size="sm" variant="secondary" onClick={() => props.onAction('stop')}>
              <Square size={13} aria-hidden="true" /> {t('common.stop')}
            </Button>
          </div>
        ) : (
          <Button
            className={
              hasMedia
                ? 'pointer-events-auto h-12 rounded-full bg-white px-6 text-base font-semibold text-neutral-950 shadow-2xl hover:bg-white/90'
                : 'pointer-events-auto h-12 rounded-full px-6 text-base font-semibold shadow-lg'
            }
            variant="default"
            onClick={() => setDialogOpen(true)}
          >
            <Radio size={17} aria-hidden="true" /> {t('common.run')}
          </Button>
        )}
      </div>
      {browserOutputActive && streamState === 'connected' ? (
        <Button
          size="icon-sm"
          variant="ghost"
          className="pointer-events-auto absolute bottom-4 right-4 z-30 text-white hover:bg-black/40 hover:text-white"
          title={muted ? t('dashboard.unmuteLiveOutput') : t('dashboard.muteLiveOutput')}
          aria-label={muted ? t('dashboard.unmuteLiveOutput') : t('dashboard.muteLiveOutput')}
          onClick={() => {
            const nextMuted = !muted;
            setMuted(nextMuted);
            if (!nextMuted) void videoRef.current?.play().catch(() => undefined);
          }}
        >
          {muted ? (
            <VolumeX size={15} aria-hidden="true" />
          ) : (
            <Volume2 size={15} aria-hidden="true" />
          )}
        </Button>
      ) : null}
      <LiveRunDialog
        open={dialogOpen}
        initialSettings={settings}
        twitchStreamKeyConfigured={props.twitchStreamKeyConfigured}
        onOpenChange={setDialogOpen}
        onRun={(nextSettings) => {
          setSettings(nextSettings);
          setDialogOpen(false);
          props.onAction('start', nextSettings);
        }}
      />
    </div>
  );
}
