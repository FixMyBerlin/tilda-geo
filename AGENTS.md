TypeScript: No return types (use satisfies instead if possible); Prefer `type` over `interface`.

Code Comments: Only add comments that provide context/meaning not already expressed by types or names. Avoid JSDoc that duplicates function signatures. Never remove existing comments—update them when the code changes. Only delete a comment when it is clearly obsolete or misleading after your edit; do not strip comments just because they seem redundant.

Local Docker / worktrees / `.env.local`: see [`docs/docker-local-development.md`](docs/docker-local-development.md).

Refactoring: When moving or renaming exports, update all importers and delete the old export—do not add re-export shims (`export { x } from '…'`) or `@deprecated` wrappers. Leave no forwarding layer. Exception: staged migrations (e.g. URL/config version migrations) may keep temporary compatibility code until the migration is complete.
