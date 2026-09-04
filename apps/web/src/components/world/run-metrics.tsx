import { Activity, Clapperboard, Gauge, MessageCircle, Radio, Wifi } from 'lucide-react';
import type { RunSnapshot } from '@infinite-world/api-contract';

import { MetricsHistory } from './metrics-history';
import { formatUptime } from './run-state';
import { useTranslation } from '../../i18n/use-translation';

export function RunMetrics({ run }: { run: RunSnapshot | null }) {
  const { t } = useTranslation();
  const metrics = [
    {
      label: t('metrics.scenes'),
      value: run?.metrics.sceneCount ?? 0,
      detail: t('metrics.inThisRun'),
      icon: <Clapperboard size={16} />,
    },
    {
      label: t('metrics.generation'),
      value: `${run?.metrics.generationLatencyMs ?? 0} ms`,
      detail: t('metrics.latestLatency'),
      icon: <Gauge size={16} />,
    },
    {
      label: t('metrics.output'),
      value: `${run?.metrics.outputFps ?? 0} fps`,
      detail: run?.metrics.outputState ?? 'idle',
      icon: <Radio size={16} />,
    },
    {
      label: t('metrics.chat'),
      value: String(run?.metrics.chatQueueDepth ?? 0),
      detail: run?.metrics.chatState ?? 'idle',
      icon: <MessageCircle size={16} />,
    },
    {
      label: t('metrics.outputLink'),
      value: run?.metrics.outputState ?? 'idle',
      detail: t('metrics.reconnects', { count: run?.metrics.outputReconnects ?? 0 }),
      icon: <Wifi size={16} />,
    },
    {
      label: t('metrics.uptime'),
      value: formatUptime(run?.metrics.uptimeSeconds ?? 0),
      detail: t('metrics.currentRun'),
      icon: <Activity size={16} />,
    },
  ];

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-6">
        {metrics.map(({ label, value, detail, icon }) => (
          <div
            className="flex min-w-0 items-start gap-3 rounded-lg border border-border bg-card px-3 py-3 sm:px-4"
            key={label}
          >
            <div
              className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"
              aria-hidden="true"
            >
              {icon}
            </div>
            <div className="grid min-w-0 gap-0.5">
              <span className="text-[11px] text-muted-foreground">{label}</span>
              <strong className="truncate text-base font-semibold tabular-nums text-foreground">
                {value}
              </strong>
              <small className="text-[11px] text-muted-foreground">{detail}</small>
            </div>
          </div>
        ))}
      </div>
      <MetricsHistory history={run?.metrics.history ?? []} />
    </>
  );
}
