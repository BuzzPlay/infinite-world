# Documentation

README contains the stable project entry point: product direction, current status, and local commands.

Use this directory for material that grows during development:

- `product/` records product concepts, terminology, and user workflows.
- `architecture/` records system structure, protocols, and data flow.
- `decisions/` records architecture decisions that affect more than one project boundary.
- `plans/` records implementation plans for work that is still in progress.
- `development-log.md` records dated implementation progress, decisions in progress, and verification notes.

Keep product behavior and setup instructions current in the root README. Keep detailed rationale, experiments, and historical notes here.

Current documents:

- [Product capabilities](product/capabilities.md)
- [Product roadmap](product/roadmap.md)
- [Runtime lifecycle](architecture/runtime-lifecycle.md)
- [HTTP and event API](architecture/http-api.md)
- [Project structure and engineering rules](architecture/project-structure.md)
- [First implementation plan](plans/0001-live-world-core-loop.md)
- [SDK-first provider integration](decisions/0002-sdk-first-provider-integration.md)

`operations/` and `incidents/` are intentionally not included yet. Add them when the project has a stable deployment process or a real incident to document.
