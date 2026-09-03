import type { WorldSnapshot } from '@infinite-world/api-contract';

import { publicRun } from './domain/run.js';
import { providerResponse } from './domain/provider.js';
import type { RuntimeState } from './runtime/state.js';
import type { RealtimeEvent, StoredRun } from './types.js';

type Listener = (event: RealtimeEvent) => void;

export class EventHub {
  private readonly listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(event: RealtimeEvent) {
    const publicEvent =
      'run' in event
        ? ({ ...event, run: publicRun(event.run as StoredRun) } as RealtimeEvent)
        : event;
    for (const listener of this.listeners) listener(publicEvent);
  }

  snapshot(state: RuntimeState): RealtimeEvent {
    return {
      type: 'snapshot',
      world: state.activeWorld ? structuredClone(state.activeWorld) : null,
      run: state.activeRun ? publicRun(state.activeRun) : null,
      providerApiKeyConfigured: providerResponse(state.provider).falApiKeyConfigured,
    };
  }
}

export function writeSse(raw: NodeJS.WritableStream, event: RealtimeEvent) {
  raw.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

export function isWorld(value: WorldSnapshot | null): value is WorldSnapshot {
  return Boolean(value?.id);
}
