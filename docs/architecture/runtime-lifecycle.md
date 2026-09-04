# Runtime Lifecycle

This document defines the first runtime flow and the responsibility of each workspace boundary.

## Boundaries

```text
Web application
      |
      | requests and events
      v
Fastify API ---- runtime state and persistence
      |
      +---- provider SDKs
      +---- Twitch chat adapter
      +---- FFmpeg output process
```

- `apps/web/` owns controls, preview playback, run status, metrics, and history views.
- `apps/api/src/routes/` owns HTTP, SSE, and WebSocket registration.
- `apps/api/src/services/` owns world, run, and provider-settings use cases.
- `apps/api/src/runtime/` owns in-memory state and run orchestration.
- `apps/api/src/domain/` owns generation rules, run records, and public response conversion.
- `apps/api/src/providers/ai/` owns hosted AI and prompt adapters.
- `apps/api/src/live/` owns chat integrations and live output processes.
- `apps/api/src/storage/` owns local persistence.
- `packages/api-contract/` owns request, response, and real-time event shapes.

## Run States

```text
Created -> Preparing -> Running -> Stopping -> Stopped
                     |          |
                     v          v
                   Failed <------
```

- `Created`: configuration has been accepted and the run has not started.
- `Preparing`: providers and outputs are being initialized.
- `Running`: the generation loop is active.
- `Stopping`: new generation work is blocked and active resources are released.
- `Stopped`: the run has ended and its configuration remains available for restart.
- `Failed`: the run stopped because of an unrecoverable provider or process error.

## Main Flow

1. The Web application submits a world configuration through the contracts package.
2. The API validates the request, persists the world, and creates a run in `Created` state.
3. A start request applies supported overrides and moves the run to `Preparing`.
4. The run manager resolves prompt, media, and output adapters. The chat adapter is available as a separate integration and is not connected to the run loop yet.
5. The prompt provider combines world context, the selected direction, and recent scene context.
6. The media provider returns preview media and metadata.
7. The API records the scene, updates metrics and history, and publishes a `scene.ready` event.
8. Preview playback and output adapters consume the scene event. RTMP output uses FFmpeg; browser output currently has a signaling placeholder while transport support is pending.
9. Stop or provider failure releases active processes and publishes the final run state.

## Boundary Rules

- `packages/api-contract` contains wire shapes only; it does not import Fastify or provider packages.
- Provider credentials stay inside `apps/api` and are never returned to the Web application.
- Provider-specific request objects stay inside `apps/api/src/providers/ai/`.
- FFmpeg stays behind `apps/api/src/live/output/`.
- Run state and persistence stay separate from HTTP route registration.
- Provider failures become API errors and real-time run events before reaching the Web application.
