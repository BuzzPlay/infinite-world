import type { SceneSnapshot, RunSnapshot } from '@infinite-world/api-contract';

import { SectionCard } from '../ui/section-card';
import { StatusBadge } from '../ui/status';
import { runTone, stateLabel } from './run-state';
import { useTranslation } from '../../i18n/use-translation';

export function RuntimeSummary({
  connected,
  run,
  state,
  currentScene,
}: {
  connected: boolean;
  run: RunSnapshot | null;
  state: RunSnapshot['state'];
  currentScene: SceneSnapshot | null;
}) {
  const { t } = useTranslation();
  const rows = [
    {
      label: t('runtime.service'),
      value: connected ? t('runtime.connected') : t('runtime.waiting'),
      tone: connected ? ('success' as const) : ('warning' as const),
    },
    {
      label: t('runtime.runState'),
      value: t(`run.${state}`) || stateLabel(state),
      tone: runTone(state),
    },
    { label: t('runtime.queueDepth'), value: String(run?.metrics.queueDepth ?? 0) },
    {
      label: t('runtime.lastContext'),
      value: currentScene?.contextSummary ?? t('runtime.noContext'),
    },
  ];

  return (
    <SectionCard title={t('runtime.runtime')} description={t('runtime.serviceGeneration')} flush>
      <div className="px-5 py-2">
        {rows.map(({ label, value, tone }) => (
          <div
            className="flex min-h-10 items-center justify-between gap-4 border-b border-border/70 text-xs text-muted-foreground last:border-0"
            key={label}
          >
            <span>{label}</span>
            {tone ? (
              <StatusBadge tone={tone}>{value}</StatusBadge>
            ) : (
              <strong className="max-w-[12rem] truncate font-medium text-foreground" title={value}>
                {value}
              </strong>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
