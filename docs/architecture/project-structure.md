# Project Structure

This document defines where new code belongs and which boundaries it may cross.

## Workspace

```text
apps/web/                 browser application
apps/api/                 local API and runtime service
packages/api-contract/    requests, responses, and real-time events
docs/                     product, architecture, decisions, and plans
```

The Web application and the API communicate through `packages/api-contract`. The Web application does not import API provider SDKs. The API does not import Web components.

## Web Application

```text
src/app/                  Next.js route composition and global styles
src/features/             page-level workflows and state coordination
src/components/layout/    application shell and navigation
src/components/ui/        reusable interface primitives
src/components/<area>/    product components for one area
src/hooks/                reusable browser hooks
src/lib/                  browser adapters, API client, and small utilities
```

- Keep page composition in `src/app/` or `src/features/`.
- Put reusable controls in `src/components/ui/`; do not create a second UI system inside a product component.
- Keep browser-only APIs and HTTP calls in `src/lib/` or a focused hook.
- Keep product state close to the feature that owns it.
- Use the shared contract types for API calls instead of redefining response shapes in Web code.

## API Service

```text
src/app.ts                 plugin setup and route composition
src/routes/                HTTP, SSE, and WebSocket registration
src/services/              world, run, and settings use cases
src/domain/                pure rules, normalization, and public conversion
src/runtime/               in-memory state and long-running orchestration
src/providers/ai/          hosted model and prompt-generation adapters
src/live/chat/             chat platform integrations
src/live/output/           FFmpeg and other live output processes
src/storage/               persistence implementations
src/shared/                errors and cross-cutting primitives
src/types.ts               API-internal types shared by the service
```

Dependency direction:

```text
route -> service -> domain
                 -> runtime state
runtime -> AI adapters, live adapters, output processes
runtime state -> storage
```

- A route parses transport input, calls one service, and returns a contract-shaped response.
- A service owns one user-facing use case. It validates state transitions and coordinates domain helpers.
- Domain code should not import Fastify, Web code, provider SDKs, or child-process code.
- Runtime code owns cancellation, process lifetime, event publication, and the continuous generation loop.
- Provider and live adapters translate external APIs or processes into internal types. They do not mutate world state directly.
- Persistence is an implementation detail. Replacing the JSON file with a database should not require route changes.
- Credentials remain inside the API service and are returned only as configured flags.

## Shared Contract

`packages/api-contract/` contains wire shapes only:

- request and response interfaces;
- run, scene, world, and provider settings snapshots;
- real-time event types;
- default values that are part of the public configuration shape.

Do not put Fastify types, Node APIs, provider SDK types, persistence models, or business logic in this package. If a persisted model differs from the public response, convert it inside `apps/api/`.

## Adding A Feature

Use the smallest set of layers that owns the change:

| Change | Add or update |
| --- | --- |
| New request or event field | `packages/api-contract/`, API validation, Web client |
| New world or run behavior | API domain helper and service, then a thin route if needed |
| New external model or LLM | `apps/api/src/providers/ai/` and provider configuration |
| New chat source | `apps/api/src/live/chat/` |
| New publishing or transport path | `apps/api/src/live/output/` |
| New persistence backend | `apps/api/src/storage/`, keeping the service interface stable |
| New screen workflow | `apps/web/src/features/` and existing UI primitives |
| Cross-boundary architectural change | an ADR in `docs/decisions/` |
| Work that spans multiple implementation steps | a plan in `docs/plans/` |

Do not add a new top-level package or abstraction until an existing boundary cannot express the change cleanly.

## When To Create A Folder

Use an existing directory when the new file has the same responsibility, dependencies, and lifecycle as the files already there. A new folder is justified when at least one of these is true:

- it introduces a separate product capability or integration boundary;
- it has different dependencies or runtime ownership;
- it needs more than one implementation, adapter, route, or test;
- the folder name gives a stable place for the next related changes.

Do not create a folder for one small helper, a single route, or a file that only differs by name. Keep the first file at the existing boundary and split into a subfolder when the boundary becomes real.

Current examples:

- `providers/ai/` separates model and prompt adapters from other API code.
- `live/chat/` and `live/output/` separate chat connections from publishing processes because they have different dependencies and lifecycles.
- `services/` stays flat while it contains only a few related use cases; it can become `services/worlds/`, `services/runs/`, and similar areas once each area has enough files or a distinct workflow.
- A new platform adapter belongs in `live/chat/` or `live/output/`; it does not create a new top-level `platforms/` directory.

Prefer this order when adding code:

```text
existing file -> existing directory -> focused subdirectory -> new package
```

Move to the next level only when the current level would mix responsibilities or make the next related change unclear.

## Verification

Run `pnpm check` before committing workspace changes. It checks formatting before the TypeScript checks. Run `pnpm lint` separately when changing Web components or API boundaries.

Run the checks that cover the changed boundary:

```text
pnpm typecheck:contracts
pnpm typecheck:api
pnpm typecheck:web
pnpm build:api
pnpm build:web
```

For a new adapter, test credential handling, request mapping, failure mapping, and cancellation. For a new run transition, test both the accepted state and the rejected states. For a Web workflow, check empty, loading, error, active, and stopped states.

Record lasting technical choices in `docs/decisions/`. Record dates and completed work in `docs/development-log.md`; do not use the development log as the only description of a stable architecture.
