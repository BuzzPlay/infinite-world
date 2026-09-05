# HTTP And Event API

The local API exposes JSON endpoints, server-sent events, and a WebSocket signaling boundary. The Web application uses the types in `packages/api-contract` and does not depend on provider SDKs.

## Local Service

```text
Next.js Web :5173  -- browser requests -->  Fastify API :4000
```

The API binds to `127.0.0.1:4000` by default. Set `INFINITE_WORLD_PORT` to use another port.
Browser requests are accepted from the local Web origins on port `5173`. Set
`INFINITE_WORLD_CORS_ORIGINS` to a comma-separated list of explicit origins when the Web application
runs elsewhere. The API loads `apps/api/.env` when present; copy `apps/api/.env.example` to use the
documented defaults as a starting point.

## API Structure

```text
routes       HTTP, SSE, and WebSocket registration
services     world, run, and provider-settings use cases
domain       generation rules, run records, and public responses
runtime      in-memory state and runtime orchestration
providers/ai AI and prompt-generation adapters
live         chat integrations and live output processes
storage      project and run-version persistence
```

Routes do not call providers or mutate persistence directly. Services coordinate domain rules through the runtime state, while external SDKs and processes stay behind AI and live adapters.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Read service health. |
| `GET` | `/api/worlds` | Read the active world and run. |
| `POST` | `/api/worlds` | Stop the active run, then validate, create, and select a world. |
| `GET` | `/api/worlds/list` | List saved worlds and the active world id. |
| `POST` | `/api/worlds/:worldId/select` | Stop the active run, then select a saved world. |
| `PUT` | `/api/worlds/:worldId` | Update a saved world's configuration. |
| `DELETE` | `/api/worlds/:worldId` | Delete a stopped world with all of its scenes and run versions. |
| `GET` | `/api/worlds/:worldId/run` | Read a run. |
| `GET` | `/api/worlds/:worldId/run/metrics` | Read current run metrics. |
| `POST` | `/api/worlds/:worldId/run/start` | Start a run with optional generation and output overrides. |
| `POST` | `/api/worlds/:worldId/run/stop` | Stop the active run. |
| `POST` | `/api/worlds/:worldId/run/restart` | Create a new run from saved settings. |
| `POST` | `/api/worlds/:worldId/run/choice` | Choose a direction for the next scene. The branch remains in the source scene's version. |
| `POST` | `/api/worlds/:worldId/run/scenes/:sceneId/activate` | Enter a saved scene and run its version without starting generation. |
| `PATCH` | `/api/worlds/:worldId/run/config` | Apply generation changes to a stopped run. |
| `POST` | `/api/worlds/:worldId/run/scenes/:sceneId/options` | Regenerate the four choices for a scene with its version's vision model. |
| `DELETE` | `/api/worlds/:worldId/run/scenes/:sceneId` | Delete a non-root scene and its descendant branch. Version roots are deleted through run history. |
| `DELETE` | `/api/worlds/:worldId/run/versions/:versionId` | Delete a stopped historical run version and its generated scenes. |
| `GET` / `PUT` | `/api/settings/providers` | Read or update local provider and chat settings. |
| `GET` | `/api/events` | Subscribe to snapshots, status, scene, and error events. |
| `WS` | `/api/worlds/:worldId/run/webrtc` | Browser-output signaling endpoint. |

`scene.ready` includes `previewUrl` and `mediaType`. The media type is `none` while a scene has no preview media, `image` for still media, and `video` for playable video results.

The WebRTC route is currently a signaling placeholder. It accepts a WebSocket connection and reports that browser-output signaling is not configured; browser transport is tracked as follow-up work.

Local data is stored under `~/.infinite-world/`. The root `state.json` contains the project index, active project, provider settings, and chat settings. Each project has its own configuration, project state, and run-version directories. Set `INFINITE_WORLD_DATA_DIR` to change the root directory. Secrets are stored locally and never included in API snapshots.

Provider credentials and live integration settings are product configuration. They are managed from
the Web Settings page and are not service environment variables.

World configuration stores the current defaults for vision and video. Each run version snapshots the full generation configuration, and continuing a story branch uses the source version's snapshot. Vision models can use either the configured Google key or the configured FAL key through the corresponding AI adapter; video models use the FAL client and the configured FAL key. A missing provider key leaves that capability as `none`.

Video configuration stores a stable model-family ID rather than a provider endpoint. The API resolves that family to a text-to-video endpoint when the first scene has no initial image, or an image-to-video endpoint when it does. The initial image is used only for the first scene. Supported durations, frame rates, resolutions, aspect ratios, and endpoint mappings live in the shared model catalog.

An RTMP run starts FFmpeg for generated video and replaces the input as new scenes arrive. Set `INFINITE_WORLD_FFMPEG_BIN` when FFmpeg is not on `PATH`. Browser output is kept as a separate signaling path so it can be replaced by a native transport later.
