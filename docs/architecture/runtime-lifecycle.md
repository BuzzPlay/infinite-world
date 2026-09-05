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
- A project keeps generated scenes across run versions. `versionId` and `version` identify the run version; `parentSceneId` and `sourceOptionId` describe the story branch.
- An explicit Run creates a version after the current version already contains scenes. The first Run uses the empty Version 1 created with the project.
- Each version stores its own generation configuration. Resuming a scene restores that version's vision and video models instead of using the most recently active version's models.
- Automatic continuation and selected story branches stay inside their source version. Selecting an option never creates a version.
- `generationTask` identifies the source scene and selected option while the next scene is being generated. The source remains the current scene until the generated scene is recorded.
- Activating a saved scene makes it the current scene and enters `Running` without generating new media or requiring provider credentials. The run waits for the user to choose a direction; choosing one validates the saved version's provider configuration before generation starts.
- `apps/api/src/providers/ai/` owns hosted AI and prompt adapters.
- `text` projects use the existing choice interaction. `voice-text` projects add a free-form input path; text and browser speech are normalized to the same story direction before generation.
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
- A run can be `Running` while it waits at a scene. Only a non-null `generationTask` means media generation is in progress.
- `Stopping`: new generation work is blocked and active resources are released.
- `Stopped`: the run has ended and its configuration remains available for restart.
- `Failed`: the run stopped because of an unrecoverable provider or process error.

## Main Flow

1. The Web application submits a world configuration through the contracts package.
2. The API validates the request, persists the world, and creates a run in `Created` state.
3. A start request applies supported overrides and moves the run to `Preparing`.
4. The run manager resolves prompt, media, and output adapters. The chat adapter is available as a separate integration and is not connected to the run loop yet.
5. The prompt provider combines world context, the selected direction, and recent scene context.
6. The media provider returns preview media and metadata. For video scenes, it extracts the last
   frame, uploads that image through the provider storage SDK, and stores the resulting URL with the
   scene. The next scene in the same version or story branch uses that image for both vision context
   and image-to-video generation.
7. The API records the scene, updates metrics and history, and publishes a `scene.ready` event.
8. Preview playback and output adapters consume the scene event. RTMP output uses FFmpeg; browser output currently has a signaling placeholder while transport support is pending.
9. Selecting an option records a story edge in the source scene's version. If that version is stopped, it becomes the active version and resumes generation.
10. Deleting the current story branch removes its descendants and returns the running view to the closest surviving parent. If generation was using the deleted branch, that generation is aborted before the parent resumes waiting.
11. Stop aborts active generation, releases run resources, clears `generationTask`, and publishes `Stopped`. The Web view returns to its Run state even when saved scenes still exist.

## Boundary Rules

- `packages/api-contract` contains wire shapes only; it does not import Fastify or provider packages.
- Provider credentials stay inside `apps/api` and are never returned to the Web application.
- Provider-specific request objects stay inside `apps/api/src/providers/ai/`.
- FFmpeg stays behind `apps/api/src/live/output/`.
- Run state and persistence stay separate from HTTP route registration.
- Provider failures become API errors and real-time run events before reaching the Web application.
