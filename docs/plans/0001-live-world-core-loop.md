# Plan 0001: Live World Core Loop

## Objective

Deliver the first complete local workflow:

```text
Configure world -> start run -> generate scenes -> preview locally -> stop run
```

## Scope

- World configuration with prompt, optional initial image, and generation settings.
- Run lifecycle and local persistence in `apps/api/`.
- Commands, responses, and run events in `packages/api-contract/`.
- Provider adapters for demo, hosted, and optional local generation.
- Local browser preview and run controls in `apps/web/`.
- Error propagation and basic status metrics.

## Work Order

1. Define the contract types for world configuration, run commands, run status, scenes, and errors.
2. Implement API state transitions and local persistence.
3. Add route handlers and the real-time event stream.
4. Add provider and output adapters.
5. Connect generated scenes to local preview and optional output.
6. Add Web controls, preview surface, and status display.
7. Add unit, integration, and browser checks for the complete flow.

## Follow-up Planning

Additional product features will be scoped in separate plans after the core loop is working.

## Verification

- `pnpm --filter @infinite-world/api typecheck`
- `pnpm --filter @infinite-world/api build`
- `pnpm --filter @infinite-world/web typecheck`
- `pnpm --filter @infinite-world/web build`
- Run the local workflow manually and confirm scene, status, error, and stop events.
