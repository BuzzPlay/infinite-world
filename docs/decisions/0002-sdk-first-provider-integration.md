# Decision 0002: SDK-First Provider Integration

## Context

Generation and media outputs need provider-specific authentication, request types, queue handling, and failure mapping. Those details should not spread into the Web application or runtime state model.

## Decision

- Keep AI provider integrations inside `apps/api/src/providers/ai/` and live integrations inside `apps/api/src/live/`.
- Prefer a maintained TypeScript SDK when it supports the required provider operation.
- Use the FAL client for hosted video generation and the OpenAI client for compatible prompt providers.
- Use `tmi.js` for Twitch chat instead of maintaining an IRC client in the API.
- Keep custom request types local to an adapter when the SDK does not expose a needed field.
- Use the documented process protocol for the optional local Python runner.
- Keep provider keys in local API storage and return only configured flags to the Web application.

## Consequences

The Web application handles stable media metadata and does not need provider credentials or provider-specific request shapes. Adding another provider requires an adapter and focused tests rather than changes to the world model.
