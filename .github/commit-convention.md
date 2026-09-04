# Commit Convention

Use a short Conventional Commit subject:

```text
<type>(<scope>): <summary>
```

The scope is optional. Keep the summary in the imperative mood, start it with a lowercase letter, and do not end it with a period.

## Types

| Type | Use for |
| --- | --- |
| `feat` | A user-visible feature or behavior change |
| `fix` | A bug fix |
| `refactor` | Code structure changes without behavior changes |
| `docs` | Documentation changes |
| `test` | Tests and test fixtures |
| `chore` | Maintenance that does not change product behavior |
| `build` | Build or dependency changes |
| `ci` | Continuous integration changes |

## Examples

```text
feat(world): add branch choice persistence
fix(web): keep the sidebar toggle visible when collapsed
docs: update the local development guide
chore: update workspace tooling
```

Keep one functional change per commit. Add a body only when the reason or trade-off is not clear from the subject. Mark breaking changes with `!` after the type or scope and explain the migration in the commit body.
