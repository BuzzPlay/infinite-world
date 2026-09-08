# Decision 0003: Project Directory Persistence

## Context

A single state file mixes shared settings, project configuration, current runtime state, and generated history. Run versions and story branches also have different lifecycles: a version groups one run, while a story edge connects generated scenes.

## Decision

- Keep the project index, active project id, and shared provider settings in the root `state.json`.
- Store each project under `projects/<project-id>/` with its configuration and project state.
- Store every run version in its own zero-padded `versions/<number>/state.json` directory.
- Keep the version ID and generation configuration in version state.
- Use the version index to group runs. Use scene ancestry only for story branches.
- Create versions through explicit Run actions. Continuing from a scene resumes its existing version and records a story branch there.
- Assemble the complete API snapshot in the storage layer so routes and Web code do not depend on the disk layout.

## Consequences

Project data can grow without expanding one global file. Returning to an older version also restores its model and generation settings. Generated video media is cached under the data root's shared `media/` directory and de-duplicated by source URL. Moving to another persistence backend remains isolated to `apps/api/src/storage/`.
