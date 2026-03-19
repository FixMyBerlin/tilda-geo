# Processing diff test runner

Runs `docker compose up processing` from the **git repo root** with command-scoped environment overrides (same idea as the **test-processing-diff** Cursor skill and [`processing/README.md`](../../../processing/README.md) § diffing).

- Skill: `.cursor/skills/test-processing-diff/SKILL.md`.
- Ensure Postgres is up, e.g. `docker compose up -d db` from the repo root; `processing` waits on a healthy `db`.

Run from `app/`:

```bash
bun run test:processing-diff -- --help
bun run test:processing-diff -- --dry-run
bun run test:processing-diff -- --preset xhain --diff-mode reference
bun run test:processing-diff -- --diff-mode fixed --topics trafficSigns,parking
```

Geofabrik OAuth and other secrets should stay in the root `.env`. This CLI mainly overrides diff/bbox/topic/skip flags; use `--download-url` only if you must override the URL for one run.

**Reference → fixed workflow:** run twice with the same bbox/topic flags: first `--diff-mode reference` (baseline), then check out your branch and run `--diff-mode fixed`. Do not change other diff-related env between those two runs.

**Reminder:** run Compose from the repo root so the root `.env` is used. The copy under `app/.env` (e.g. from `npm run predev`) is for the Next app, not for this container.
