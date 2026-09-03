# Product Roadmap

This roadmap covers the current Live World workflow and its next product capabilities. Each stage has a usable result and can be verified independently.

## Stage 0: Foundation

- Define the World, Run, Scene, Event, Preview, and Output concepts.
- Define request, response, and real-time event contracts.
- Define run state transitions and error categories.
- Keep provider-specific settings behind the media boundary.

Result: the project boundaries and contracts are ready for the first end-to-end flow.

## Stage 1: Live World Core Loop

- Create and validate a world configuration.
- Start and stop a run.
- Generate an initial scene and consecutive scenes.
- Carry the latest scene and recent context into the next generation.
- Show the current result in a local browser preview.
- Send basic run status and error events to the Web application.

Result: a user can configure a world, run continuous generation, preview it locally, and control the run.

## Stage 2: Generation Controls

- Add a generation backend adapter.
- Add local and hosted backend configurations as separate implementations.
- Add image-to-video input, character references, generation modes, and backend-specific parameters.
- Add prompt generation modes and editable system prompts.
- Add text overlays and media metadata.

Result: the same world flow can use different generation configurations without changes to the world model.

## Stage 3: Inputs And Live Outputs

- Add an external event adapter and an event queue.
- Add chat input with configurable lookback.
- Add low-latency browser transport for local preview.
- Add RTMP publishing through FFmpeg scene transport.
- Add output start, stop, reconnect, and health state.

Result: a running world can publish a selected output. External input and browser transport remain follow-up work.

## Stage 4: Dashboard And Observation

- Add generation history and run configuration history. [done: persisted run history]
- Add queue, generation, playback, and output metrics.
- Add real-time charts and performance breakdowns.
- Add connection recovery and actionable error messages.
- Add controls for advanced generation settings.

Result: the Web application can operate and inspect a running world from one place.

## Scope Boundary

The current plan ends with a controllable, observable Live World workflow. Additional product areas will have separate scope and plans.
