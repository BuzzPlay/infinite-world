import type { RunMetricsSample } from '@infinite-world/api-contract';
import { useTranslation } from '../../i18n/use-translation';

export function MetricsHistory({ history }: { history: RunMetricsSample[] }) {
  const { t } = useTranslation();
  const samples = history.slice(-30);
  if (samples.length < 2) return null;

  const maxLatency = Math.max(...samples.map((sample) => sample.generationLatencyMs), 1);
  const latest = samples[samples.length - 1];

  return (
    <section
      className="mt-4 rounded-lg border border-border bg-card px-4 py-3"
      aria-label={t('history.metricsHistory')}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-medium text-foreground">{t('history.recentActivity')}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {t('history.lastSamples', { count: samples.length })}
          </p>
        </div>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {t('history.latestLatency', { value: latest.generationLatencyMs })}
        </span>
      </div>
      <div
        className="mt-3 flex h-16 items-end gap-1"
        role="img"
        aria-label={t('history.latencyOverSamples')}
      >
        {samples.map((sample) => (
          <span
            className="min-w-0 flex-1 rounded-t-sm bg-primary/65 transition-[height]"
            key={sample.timestamp}
            style={{ height: `${Math.max((sample.generationLatencyMs / maxLatency) * 100, 4)}%` }}
            title={`${sample.generationLatencyMs} ms`}
          />
        ))}
      </div>
    </section>
  );
}
