import type { RunState } from '@infinite-world/api-contract';

import type { StatusTone } from '../ui/status';

const stateLabels: Record<RunState, string> = {
  created: 'Ready',
  preparing: 'Preparing',
  running: 'Running',
  stopping: 'Stopping',
  stopped: 'Stopped',
  failed: 'Failed',
};

const stateRanks: Record<RunState, number> = {
  created: 0,
  preparing: 1,
  running: 2,
  stopping: 3,
  stopped: 4,
  failed: 5,
};

export function stateLabel(state: RunState) {
  return stateLabels[state];
}

export function runTone(state: RunState): StatusTone {
  if (state === 'running') return 'success';
  if (state === 'preparing' || state === 'stopping') return 'info';
  if (state === 'failed') return 'destructive';
  return 'neutral';
}

export function runStateRank(state: RunState) {
  return stateRanks[state];
}

export function formatUptime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes ? `${minutes}m ${remainder}s` : `${remainder}s`;
}
