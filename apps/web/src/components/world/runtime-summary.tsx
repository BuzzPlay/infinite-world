import type { SceneSnapshot, RunSnapshot } from '@infinite-world/api-contract';

import { SectionCard } from '../ui/section-card';
import { StatusBadge } from '../ui/status';
import { runTone, stateLabel } from './run-state';

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
  const rows = [
    { label: 'Service', value: connected ? 'Connected' : 'Waiting', tone: connected ? 'success' as const : 'warning' as const },
    { label: 'Run state', value: stateLabel(state), tone: runTone(state) },
    { label: 'Queue depth', value: String(run?.metrics.queueDepth ?? 0) },
    { label: 'Last context', value: currentScene?.contextSummary ?? 'No context' },
  ];

  return (
    <SectionCard title="Runtime" description="Service and generation state" flush>
      <div className="px-5 py-2">
        {rows.map(({ label, value, tone }) => (
          <div className="flex min-h-10 items-center justify-between gap-4 border-b border-border/70 text-xs text-muted-foreground last:border-0" key={label}>
            <span>{label}</span>
            {tone ? <StatusBadge tone={tone}>{value}</StatusBadge> : <strong className="max-w-[12rem] truncate font-medium text-foreground" title={value}>{value}</strong>}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
