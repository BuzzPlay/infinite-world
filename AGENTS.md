# Infinite World Agent Guide

`CLAUDE.md` imports this file for Claude Code. Keep project rules here instead of duplicating them in tool-specific instruction files.

## Current Status

This repository contains the first local Live World implementation. Keep external application code out of this repository unless a specific migration is documented.

Keep new product behavior, API handlers, media processing, and UI changes behind an explicitly designed and documented boundary.

## Project Boundaries

- `apps/web/` is the browser application. Use React and Next.js with the App Router under `src/app/`.
- `apps/api/` owns the Fastify service, API routes, runtime state, AI adapters, live integrations, and output processes.
- `packages/api-contract/` owns stable request, response, and real-time event shapes.
- `runners/` contains optional local model adapters that communicate with the API through NDJSON.
- `docs/product/` records product concepts and user workflows.
- `docs/architecture/` records system structure, protocols, and data flow.
- `docs/decisions/` records decisions that affect more than one boundary.
- `docs/plans/` records short-lived implementation plans.
- `docs/development-log.md` records chronological progress.

Desktop packaging is out of scope for the initial structure. Do not create a desktop app directory yet.

## UI Work

Read `.agents/skills/ui-ux-pro-max/SKILL.md` before changing a visual surface. Use its search and review workflow to make decisions for this product instead of copying external branding, product text, or components.

Read `.agents/skills/react-doctor/SKILL.md` before finishing a React feature or reviewing the Web application. Run its changed-scope check after Web changes. Keep route composition in `src/app/`, reusable UI in `src/components/`, and browser/API adapters in `src/lib/`.

Keep world creation, branch exploration, and local preview as the first product workflows. Treat live streaming as the first roadmap output, not as the whole product. Avoid adding unrelated platform features.

## Dependency And Code Rules

- Prefer the existing workspace boundaries over new top-level folders.
- Add a dependency only when a real implementation needs it.
- Prefer a maintained official SDK for provider, storage, media, and client integrations when one exists for the language and runtime in use.
- Keep provider credentials in the service boundary. The Web application should call the local API rather than embedding provider keys.
- If no suitable SDK exists for the selected language, use the provider's documented protocol behind one adapter and record that choice in `docs/decisions/`.
- Keep transport contracts separate from domain behavior.
- Keep AI adapters behind `apps/api/src/providers/ai/` and live integrations and output processes behind `apps/api/src/live/`.
- Do not commit local environment files, credentials, generated output, or dependency directories.

## Verification

Run `pnpm --filter @infinite-world/api typecheck` after changing API implementation and the relevant `pnpm --filter @infinite-world/web` command after adding Web implementation. Run both builds when changing the shared contracts package or an API response.
