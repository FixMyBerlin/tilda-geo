# About

**A script to rebuild the tasks of a MR challenge.**

This is needed to refresh the task list when tasks changed in the source file.

This will first delete all unfinished tasks and rebuild them.

See https://maproulette.org/docs/swagger-ui/index.html#/Challenge/rebuildChallenge for more.

## Params

You can use the `filter` param to only run specific challenges. See [package.json](../../package.json) `bun run maproulette-help` for more.

## Cron job

Triggered by [`.github/workflows/generate-maproulette-tasks.production.yml`](.github/workflows/generate-maproulette-tasks.production.yml).

Use `journalctl CONTAINER_NAME=app --since=2025-02-28 | grep 'MaprouletteRebuild'` on the server to see the logs.
