# Product Capabilities

This document defines the capability baseline currently supported by the local workflow. Follow-up capabilities remain in `docs/product/roadmap.md`.

## World Setup

- Create a world with a name, initial prompt, initial image, and optional character references.
- Select a generation backend and configure output when starting a run.
- Configure dimensions, frame count or duration, frame rate, guidance, seed, and generation mode when supported by the backend.
- Save the configuration used by each run.

## Continuous Generation

- Generate the first scene from the world configuration.
- Generate consecutive scenes from the latest scene, current world state, and recent generation context.
- Create prompts from the world state, selected directions, and recent scene context.
- Support hosted generation through provider adapters.
- Support image-to-video input and character references when the selected backend provides them.
- Track the run state, scene count, prompt history, timing, and errors.

## Inputs And Events

- Accept manual updates to the world prompt and generation settings while a run is stopped.
- Keep input adapters independent from the world and media model. A chat adapter exists, but run-loop integration is planned.

## Preview And Outputs

- Preview the current scene in the browser during a local run.
- Support video and audio playback with mute and connection state controls.
- Preview generated image/video media in the browser.
- Provide an FFmpeg-backed RTMP output path for live publishing.
- Start and stop the configured RTMP output with the run lifecycle.

## Control And Observation

- Start, stop, and restart a run.
- Update supported settings while a run is stopped.
- Expose generation, queue, playback, connection, and output metrics.
- Publish run status, scene events, metrics, and errors through a real-time event stream.
- Stream run metrics independently while a run is active.
- Keep generation history and the configuration used for each run.
- Report provider, media, and output failures with enough context for recovery.

## First Acceptance Flow

1. Create a world with an initial prompt and generation settings.
2. Start a run and generate the first scene.
3. Continue generation using the current scene and context.
4. View the current result in the browser.
5. Stop and restart the run without losing its configuration.
6. Receive status and error updates while the run is active.
