import type {
  CreateWorldRequest,
  ChooseSceneOptionRequest,
  StartRunRequest,
  UpdateRunConfigRequest,
  WorldListResponse,
  ProviderSettingsResponse,
  RunMetricsResponse,
  RunResponse,
  RealtimeEvent,
  UpdateProviderSettingsRequest,
  WorldConfig,
  WorldResponse,
} from '@infinite-world/api-contract';

import { apiUrl, websocketUrl } from './api-url';

const jsonHeaders = { 'Content-Type': 'application/json' };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), init);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(body?.error?.message ?? `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export function getCurrentWorld() {
  return request<WorldResponse>('/api/worlds');
}

export function createWorld(world: WorldConfig) {
  const payload: CreateWorldRequest = {
    world,
  };
  return request<WorldResponse>('/api/worlds', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export function updateWorld(worldId: string, world: WorldConfig) {
  const payload: CreateWorldRequest = { world };
  return request<WorldResponse>(`/api/worlds/${worldId}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export function listWorlds() {
  return request<WorldListResponse>('/api/worlds/list');
}

export function selectWorld(worldId: string) {
  return request<WorldResponse>(`/api/worlds/${worldId}/select`, { method: 'POST' });
}

export function getProviderSettings() {
  return request<ProviderSettingsResponse>('/api/settings/providers');
}

export function updateProviderSettings(settings: UpdateProviderSettingsRequest) {
  return request<ProviderSettingsResponse>('/api/settings/providers', {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(settings),
  });
}

export function startRun(worldId: string, settings?: StartRunRequest) {
  return request<RunResponse>(`/api/worlds/${worldId}/run/start`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(settings ?? {}),
  });
}

export function stopRun(worldId: string) {
  return request<RunResponse>(`/api/worlds/${worldId}/run/stop`, { method: 'POST' });
}

export function getRunMetrics(worldId: string) {
  return request<RunMetricsResponse>(`/api/worlds/${worldId}/run/metrics`);
}

export function subscribeToRunMetrics(
  worldId: string,
  onMetrics: (response: RunMetricsResponse) => void,
  onError?: () => void,
) {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | undefined;
  let reconnectAttempt = 0;
  let closed = false;
  let failureReported = false;

  const scheduleReconnect = () => {
    if (closed || reconnectTimer !== undefined) return;
    if (!failureReported) {
      failureReported = true;
      onError?.();
    }
    const delay = Math.min(1_000 * 2 ** reconnectAttempt, 30_000);
    reconnectAttempt += 1;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = undefined;
      connect();
    }, delay);
  };

  const connect = () => {
    if (closed) return;
    const current = new WebSocket(websocketUrl(`/api/worlds/${worldId}/run/metrics/ws`));
    socket = current;
    current.addEventListener('open', () => {
      reconnectAttempt = 0;
      failureReported = false;
    });
    current.addEventListener('message', (event) => {
      try {
        const response = JSON.parse(event.data) as RunMetricsResponse & { type?: string };
        if (response.type === 'error') onError?.();
        else if (response.runId && response.metrics) onMetrics(response);
      } catch {
        onError?.();
      }
    });
    current.addEventListener('error', scheduleReconnect);
    current.addEventListener('close', scheduleReconnect);
  };

  connect();
  return () => {
    closed = true;
    if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
    const current = socket;
    socket = null;
    if (current && current.readyState !== WebSocket.CLOSED) current.close();
  };
}

export function restartRun(worldId: string) {
  return request<RunResponse>(`/api/worlds/${worldId}/run/restart`, { method: 'POST' });
}

export function updateRunConfig(worldId: string, settings: UpdateRunConfigRequest) {
  return request<RunResponse>(`/api/worlds/${worldId}/run/config`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(settings),
  });
}

export function chooseSceneOption(worldId: string, optionId: string) {
  const payload: ChooseSceneOptionRequest = { optionId };
  return request<RunResponse>(`/api/worlds/${worldId}/run/choice`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export function subscribeToEvents(onEvent: (event: RealtimeEvent) => void) {
  const source = new EventSource(apiUrl('/api/events'));
  const handleMessage = (message: MessageEvent<string>) => {
    try {
      onEvent(JSON.parse(message.data) as RealtimeEvent);
    } catch {
      // Ignore malformed events so one provider message cannot break the stream.
    }
  };

  source.addEventListener('snapshot', handleMessage);
  source.onmessage = handleMessage;

  return () => {
    source.removeEventListener('snapshot', handleMessage);
    source.close();
  };
}
