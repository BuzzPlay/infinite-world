import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import { DEFAULT_GENERATION } from '@infinite-world/api-contract';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../src/app.js';
import { appendScene, newRun, preserveSceneVersions } from '../src/domain/run.js';
import { RuntimeState } from '../src/runtime/state.js';
import type { GeneratedScene, RuntimeSnapshot } from '../src/types.js';

const WEB_ORIGIN = 'http://localhost:5173';
const EMPTY_STATE: RuntimeSnapshot = {
  worlds: [],
  activeWorldId: null,
  runs: [],
  provider: {},
};

describe('local API', () => {
  let app: FastifyInstance;
  let state: RuntimeState;

  before(async () => {
    state = new RuntimeState(structuredClone(EMPTY_STATE), () => undefined);
    app = buildApp({ state, corsOrigins: [WEB_ORIGIN] });
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('supports health, provider configuration, and the project lifecycle', async () => {
    const health = await app.inject({
      method: 'GET',
      url: '/api/health',
      headers: { origin: WEB_ORIGIN },
    });
    assert.equal(health.statusCode, 200);
    assert.deepEqual(health.json(), { ok: true, service: 'infinite-world-api' });
    assert.equal(health.headers['access-control-allow-origin'], WEB_ORIGIN);

    const providerUpdate = await app.inject({
      method: 'PUT',
      url: '/api/settings/providers',
      payload: { falApiKey: 'test-api-key' },
    });
    assert.equal(providerUpdate.statusCode, 200);
    assert.equal(providerUpdate.json().falApiKeyConfigured, true);
    assert.equal('falApiKey' in providerUpdate.json(), false);

    const openaiProviderUpdate = await app.inject({
      method: 'PUT',
      url: '/api/settings/providers',
      payload: {
        openaiApiKey: 'test-openai-key',
        openaiBaseUrl: 'http://localhost:11434/v1/',
      },
    });
    assert.equal(openaiProviderUpdate.statusCode, 200);
    assert.equal(openaiProviderUpdate.json().openaiApiKeyConfigured, true);
    assert.equal(openaiProviderUpdate.json().openaiBaseUrl, 'http://localhost:11434/v1');
    assert.equal('openaiApiKey' in openaiProviderUpdate.json(), false);

    const invalidOpenaiBaseUrl = await app.inject({
      method: 'PUT',
      url: '/api/settings/providers',
      payload: { openaiBaseUrl: 'http://proxy.example.test/v1' },
    });
    assert.equal(invalidOpenaiBaseUrl.statusCode, 400);
    assert.equal(invalidOpenaiBaseUrl.json().error.code, 'invalid_openai_base_url');

    const unsupportedInteraction = await app.inject({
      method: 'POST',
      url: '/api/worlds',
      payload: {
        world: {
          interactionType: 'unknown',
          name: 'Unsupported world',
          prompt: 'An unsupported interaction',
          generation: structuredClone(DEFAULT_GENERATION),
        },
      },
    });
    assert.equal(unsupportedInteraction.statusCode, 400);
    assert.equal(unsupportedInteraction.json().error.code, 'invalid_interaction_type');

    const unsupportedOptionLanguage = await app.inject({
      method: 'POST',
      url: '/api/worlds',
      payload: {
        world: {
          interactionType: 'text',
          optionLanguage: 'unsupported',
          name: 'Unsupported language world',
          prompt: 'An unsupported option language',
          generation: structuredClone(DEFAULT_GENERATION),
        },
      },
    });
    assert.equal(unsupportedOptionLanguage.statusCode, 400);
    assert.equal(unsupportedOptionLanguage.json().error.code, 'invalid_option_language');

    const first = await createWorld(app, 'First world');
    const second = await createWorld(app, 'Second world');

    const list = await app.inject({ method: 'GET', url: '/api/worlds/list' });
    assert.equal(list.statusCode, 200);
    assert.equal(list.json().worlds.length, 2);
    assert.equal(list.json().activeWorldId, second.world.id);

    const selected = await app.inject({
      method: 'POST',
      url: `/api/worlds/${first.world.id}/select`,
    });
    assert.equal(selected.statusCode, 200);
    assert.equal(selected.json().world.id, first.world.id);

    const runningFirst = state.getRun(first.world.id);
    assert.ok(runningFirst);
    runningFirst.state = 'running';
    const switchedWhileRunning = await app.inject({
      method: 'POST',
      url: `/api/worlds/${second.world.id}/select`,
    });
    assert.equal(switchedWhileRunning.statusCode, 200);
    assert.equal(switchedWhileRunning.json().world.id, second.world.id);
    assert.equal(state.getRun(first.world.id)?.state, 'stopped');

    const reselected = await app.inject({
      method: 'POST',
      url: `/api/worlds/${first.world.id}/select`,
    });
    assert.equal(reselected.statusCode, 200);

    const deletedCurrent = await app.inject({
      method: 'DELETE',
      url: `/api/worlds/${first.world.id}`,
    });
    assert.equal(deletedCurrent.statusCode, 200);
    assert.equal(deletedCurrent.json().deletedWorldId, first.world.id);
    assert.equal(deletedCurrent.json().activeWorld.world.id, second.world.id);

    const activeRun = state.getRun(second.world.id);
    assert.ok(activeRun);
    activeRun.state = 'running';
    const rejectedActive = await app.inject({
      method: 'DELETE',
      url: `/api/worlds/${second.world.id}`,
    });
    assert.equal(rejectedActive.statusCode, 409);
    assert.equal(rejectedActive.json().error.code, 'invalid_state');
    activeRun.state = 'stopped';

    const deletedFinal = await app.inject({
      method: 'DELETE',
      url: `/api/worlds/${second.world.id}`,
    });
    assert.equal(deletedFinal.statusCode, 200);
    assert.equal(deletedFinal.json().activeWorld, null);

    const emptyList = await app.inject({ method: 'GET', url: '/api/worlds/list' });
    assert.equal(emptyList.statusCode, 200);
    assert.deepEqual(emptyList.json().worlds, []);
    assert.equal(emptyList.json().activeWorldId, null);
  });

  test('allows configured preflight requests and omits CORS headers for other origins', async () => {
    const preflight = await app.inject({
      method: 'OPTIONS',
      url: '/api/settings/providers',
      headers: {
        origin: WEB_ORIGIN,
        'access-control-request-method': 'PUT',
        'access-control-request-headers': 'content-type',
      },
    });
    assert.equal(preflight.statusCode, 204);
    assert.equal(preflight.headers['access-control-allow-origin'], WEB_ORIGIN);
    assert.match(preflight.headers['access-control-allow-methods'] ?? '', /PUT/);

    const untrusted = await app.inject({
      method: 'OPTIONS',
      url: '/api/settings/providers',
      headers: {
        origin: 'https://example.com',
        'access-control-request-method': 'PUT',
      },
    });
    assert.equal(untrusted.statusCode, 204);
    assert.equal(untrusted.headers['access-control-allow-origin'], undefined);
  });

  test('registers websocket signaling after the transport plugin is ready', async () => {
    let resolveMessage: (message: string) => void;
    const message = new Promise<string>((resolve) => {
      resolveMessage = resolve;
    });
    const socket = await app.injectWS(
      '/api/worlds/test-world/run/webrtc',
      {},
      {
        onInit: (client) => {
          client.once('message', (data: { toString(): string }) => resolveMessage(data.toString()));
        },
      },
    );

    try {
      assert.deepEqual(JSON.parse(await message), { type: 'ready' });
    } finally {
      socket.close();
    }
  });
});

describe('scene branch API', () => {
  test('deletes stopped and active branches with their descendants', async () => {
    const worldId = 'world-with-history';
    const run = newRun(worldId, 'run-with-history');
    const root = appendScene(run, generatedScene('Root'), DEFAULT_GENERATION, null);
    const child = appendScene(run, generatedScene('Child'), DEFAULT_GENERATION, {
      sceneId: root.id,
      optionId: root.options[0]?.id ?? null,
    });
    const grandchild = appendScene(run, generatedScene('Grandchild'), DEFAULT_GENERATION, {
      sceneId: child.id,
      optionId: child.options[0]?.id ?? null,
    });
    const sibling = appendScene(run, generatedScene('Sibling'), DEFAULT_GENERATION, {
      sceneId: root.id,
      optionId: root.options[1]?.id ?? null,
    });
    run.state = 'stopped';

    const state = new RuntimeState(
      {
        worlds: [
          {
            id: worldId,
            interactionType: 'text',
            name: 'World with history',
            prompt: 'A world with scene versions',
            generation: structuredClone(DEFAULT_GENERATION),
            createdAt: new Date(0).toISOString(),
          },
        ],
        activeWorldId: worldId,
        runs: [run],
        provider: {},
      },
      () => undefined,
    );
    const app = buildApp({ state, corsOrigins: [WEB_ORIGIN] });
    await app.ready();

    try {
      const removed = await app.inject({
        method: 'DELETE',
        url: `/api/worlds/${worldId}/run/scenes/${child.id}`,
      });
      assert.equal(removed.statusCode, 200);
      assert.deepEqual(
        removed.json().run.scenes.map((scene: { id: string }) => scene.id),
        [root.id, sibling.id],
      );
      assert.equal(
        removed.json().run.scenes.some((scene: { id: string }) => scene.id === grandchild.id),
        false,
      );

      const rootRejection = await app.inject({
        method: 'DELETE',
        url: `/api/worlds/${worldId}/run/scenes/${root.id}`,
      });
      assert.equal(rootRejection.statusCode, 409);
      assert.equal(rootRejection.json().error.code, 'invalid_state');
      assert.equal(
        state.getRun(worldId)?.scenes.some((scene) => scene.id === root.id),
        true,
      );

      const activated = await app.inject({
        method: 'POST',
        url: `/api/worlds/${worldId}/run/scenes/${sibling.id}/activate`,
      });
      assert.equal(activated.statusCode, 200);
      assert.equal(activated.json().run.state, 'running');
      assert.equal(activated.json().run.currentScene.id, sibling.id);
      assert.equal(activated.json().run.generationTask, null);

      const deletedWhileRunning = await app.inject({
        method: 'DELETE',
        url: `/api/worlds/${worldId}/run/scenes/${sibling.id}`,
      });
      assert.equal(deletedWhileRunning.statusCode, 200);
      assert.equal(
        state.getRun(worldId)?.scenes.some((scene) => scene.id === sibling.id),
        false,
      );
      assert.equal(state.getRun(worldId)?.state, 'running');
      assert.equal(state.getRun(worldId)?.currentScene?.id, root.id);

      const stopped = await app.inject({
        method: 'POST',
        url: `/api/worlds/${worldId}/run/stop`,
      });
      assert.equal(stopped.statusCode, 200);
      assert.equal(stopped.json().run.state, 'stopped');
    } finally {
      await app.close();
    }
  });
});

describe('run version API', () => {
  test('deletes selected versions and clears the final version', async () => {
    const worldId = 'world-with-versions';
    const previous = newRun(worldId, 'run-1', 1);
    const previousRoot = appendScene(
      previous,
      generatedScene('Previous root'),
      DEFAULT_GENERATION,
      null,
    );
    const current = preserveSceneVersions(previous, newRun(worldId, 'run-2', 2));
    const currentRoot = appendScene(current, generatedScene('Current root'), DEFAULT_GENERATION, {
      sceneId: previousRoot.id,
      optionId: previousRoot.options[0]?.id ?? null,
    });
    current.state = 'running';

    const state = new RuntimeState(
      {
        worlds: [
          {
            id: worldId,
            interactionType: 'text',
            name: 'World with versions',
            prompt: 'A world with saved versions',
            generation: structuredClone(DEFAULT_GENERATION),
            createdAt: new Date(0).toISOString(),
          },
        ],
        activeWorldId: worldId,
        runs: [current],
        provider: {},
      },
      () => undefined,
    );
    const app = buildApp({ state, corsOrigins: [WEB_ORIGIN] });
    await app.ready();

    try {
      const activeRejection = await app.inject({
        method: 'DELETE',
        url: `/api/worlds/${worldId}/run/versions/${previous.id}`,
      });
      assert.equal(activeRejection.statusCode, 409);

      const storedRun = state.getRun(worldId);
      assert.ok(storedRun);
      storedRun.state = 'stopped';
      const removed = await app.inject({
        method: 'DELETE',
        url: `/api/worlds/${worldId}/run/versions/${previous.id}`,
      });
      assert.equal(removed.statusCode, 200);
      assert.deepEqual(
        removed.json().run.scenes.map((scene: { id: string }) => scene.id),
        [currentRoot.id],
      );
      assert.equal(removed.json().run.scenes[0]?.parentSceneId, null);
      assert.equal(removed.json().run.scenes[0]?.sourceOptionId, null);

      const currentRemoval = await app.inject({
        method: 'DELETE',
        url: `/api/worlds/${worldId}/run/versions/${current.id}`,
      });
      assert.equal(currentRemoval.statusCode, 200);
      assert.deepEqual(currentRemoval.json().run.scenes, []);
      assert.equal(currentRemoval.json().run.state, 'created');
      assert.notEqual(currentRemoval.json().run.id, current.id);
    } finally {
      await app.close();
    }
  });
});

async function createWorld(app: FastifyInstance, name: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/worlds',
    payload: {
      world: {
        interactionType: 'text',
        name,
        prompt: `A starting point for ${name}`,
        generation: structuredClone(DEFAULT_GENERATION),
      },
    },
  });
  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.world.name, name);
  assert.equal(body.world.interactionType, 'text');
  assert.equal(body.world.optionLanguage, 'en');
  assert.equal(body.run.state, 'created');
  return body;
}

function generatedScene(prompt: string): GeneratedScene {
  return {
    prompt,
    contextSummary: prompt,
    previewUrl: `https://example.com/${encodeURIComponent(prompt)}.mp4`,
    mediaType: 'video',
    options: testOptions(),
    generationLatencyMs: 100,
  };
}

function testOptions() {
  return ['A', 'B', 'C', 'D'].map((label) => ({
    id: `test-option-${label}`,
    label,
    title: `Option ${label}`,
    votes: 0,
  }));
}
