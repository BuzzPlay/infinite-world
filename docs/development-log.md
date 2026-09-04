# Development Log

This file records project progress without turning the root README into a chronological changelog.

## 2026-09-01: Initial Scaffold

- Created the `apps/web`, `apps/api`, `packages/api-contract`, and `docs` boundaries.
- Selected React + Next.js for the Web boundary and Fastify + TypeScript for the API boundary.
- Deferred desktop packaging.
- Added the shared UI and interface-quality skills used by the Web application.

## 2026-09-01: Product And Runtime Planning

- Moved detailed roadmap scope into `docs/product/roadmap.md`.
- Added the initial capability list and runtime lifecycle.
- Added the first implementation plan for the Live World core loop.
- Kept the root README roadmap as a short product overview.

## 2026-09-03: API Boundary

- Added the Fastify API with modular routes, runtime state, local JSON persistence, and real-time events.
- Split API code into domain, runtime, routes, services, storage, AI providers, and live adapters.
- Added SDK adapters for hosted generation, prompt providers, and Twitch chat.
- Added hosted provider adapters and an FFmpeg output boundary.
- Removed the previous service implementation and its language-specific skills.
- Added a root Biome formatter and shared TypeScript compiler base configuration.
- Verified API and Web type checks and production builds.

## Log Format

Each entry should include the date, the scope of the change, the important decision, and the verification performed.
