import type {
  ChooseSceneOptionRequest,
  CreateWorldRequest,
  DeleteWorldResponse,
  ProviderSettingsResponse,
  RealtimeEvent,
  RunResponse,
  StartRunRequest,
  SubmitInteractionRequest,
  UpdateProviderSettingsRequest,
  UpdateRunConfigRequest,
  WorldConfig,
  WorldListResponse,
  WorldResponse,
} from '@infinite-world/api-contract';

import { apiUrl } from './api-url';

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

export function deleteWorld(worldId: string) {
  return request<DeleteWorldResponse>(`/api/worlds/${worldId}`, { method: 'DELETE' });
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

export function chooseSceneOption(worldId: string, optionId: string, sceneId?: string) {
  const payload: ChooseSceneOptionRequest = { optionId, sceneId };
  return request<RunResponse>(`/api/worlds/${worldId}/run/choice`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export function submitInteraction(worldId: string, input: string, sceneId?: string) {
  const payload: SubmitInteractionRequest = { input, sceneId };
  return request<RunResponse>(`/api/worlds/${worldId}/run/input`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export function activateScene(worldId: string, sceneId: string) {
  return request<RunResponse>(`/api/worlds/${worldId}/run/scenes/${sceneId}/activate`, {
    method: 'POST',
  });
}

export function deleteRunVersion(worldId: string, versionId: string) {
  return request<RunResponse>(`/api/worlds/${worldId}/run/versions/${versionId}`, {
    method: 'DELETE',
  });
}

export function deleteSceneBranch(worldId: string, sceneId: string) {
  return request<RunResponse>(`/api/worlds/${worldId}/run/scenes/${sceneId}`, {
    method: 'DELETE',
  });
}

export function regenerateSceneOptions(worldId: string, sceneId: string) {
  return request<RunResponse>(`/api/worlds/${worldId}/run/scenes/${sceneId}/options`, {
    method: 'POST',
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

  const eventTypes: RealtimeEvent['type'][] = [
    'snapshot',
    'run.status',
    'scene.ready',
    'scene.deleted',
    'version.deleted',
    'run.error',
  ];
  eventTypes.forEach((eventType) => {
    source.addEventListener(eventType, handleMessage);
  });

  return () => {
    eventTypes.forEach((eventType) => {
      source.removeEventListener(eventType, handleMessage);
    });
    source.close();
  };
}
