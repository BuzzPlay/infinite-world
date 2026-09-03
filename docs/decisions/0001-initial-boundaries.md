# ADR 0001: Initial Project Boundaries

## Status

Accepted for the initial implementation.

## Decision

Infinite World uses a small workspace with a React + Next.js Web application, a Fastify TypeScript API, an optional local model runner, and a shared API contract package.

```text
Web (React + Next.js)
        |
        | shared contracts
        v
Fastify API ---- local state and runtime
        |
        +---- provider SDKs and chat adapters
        +---- FFmpeg output
        +---- optional Python runner
```

## Reasons

- The Web layer stays focused on world management, branch exploration, and local preview.
- Fastify keeps HTTP, WebSocket, persistence, and runtime orchestration in one service boundary with a large TypeScript ecosystem.
- Provider adapters and output processes are separate modules, so external integrations do not spread through routes or UI code.
- A contracts package keeps the browser/API boundary explicit as the project grows.
- Desktop is deferred until the Web workflow is stable, so no desktop framework is included in the initial tree.

## Consequences

The first implementation contains a local Web experience, API routes, a persistent world run state, and a demo media generator. Hosted providers, chat, local inference, and output processes can evolve behind their adapters without changing the Web contract.
