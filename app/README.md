# `app` README

## Monorepo

Please read the [README](../README.md) first.

## About

The frontend visualizes our processed data it also provides options to annotate and export the data.

## Development

### Initial setup

1. Create a `/.env` file in the **repository root** based on [`/.env.example`](../.env.example). Required for all local dev; `.env.local` is auto-generated on feature branches in worktrees (see below).
2. Set `VITE_APP_ORIGIN=http://127.0.0.1:5173` (and `VITE_APP_ENV=development`). No `/etc/hosts` or certificates needed.
3. To test the login, set up your own OSM OAuth 2 application (see [osm-auth](https://github.com/osmlab/osm-auth#registering-an-application)) and add credentials to the root `.env`.
4. From `app/`, run `bun run seed` once to fill the local database.

**Why `127.0.0.1` and not `localhost`?** See [Local Development Domain Setup](../docs/Local-Development-Domain-Setup.md).

**Worktrees and Docker:** See [Docker local development](../docs/docker-local-development.md). Work branches use short names like `my-branch`: `bun run setup-worktree -- my-branch` then `bun run dev` in the new folder.

### Start

From `app/`, run `bun run dev`. Open **http://127.0.0.1:5173**.

That also:

- Checks Docker and starts the stack if needed
- Picks worktree Docker names and ports so db, tiles, and Vite line up

Run `nvm use` for Prisma and Playwright (they spawn Node; `bun run dev` uses Bun).

### Host binaries (local vs server)

The app looks up `ogr2ogr`, `pg_restore`, and `tippecanoe` on **PATH**. They are only used when you run the features below.

#### Staging / production

Already in the app image ([`app.Dockerfile` L14–L17](../app.Dockerfile#L14-L17)).

#### Local

`bun run dev` uses the host. Install the tools below.

- **GDAL 3.8+** (`ogr2ogr`)
  - Used: `data-schema-load`, local `/api/export`, static-dataset GeoJSON CRS/precision.
  - Install: `brew install gdal`
- **PostgreSQL client** (`pg_restore`)
  - Used: `/admin/data-schema` **Import**. Must match the dump major ([data-schema README](../data-schema/README.md#postgres-major-versions)). Staging/production: `postgresql-client` in the app image.
  - Install: `brew install libpq`. Homebrew does not put `pg_restore` on PATH (keg-only). Add `export PATH="$(brew --prefix libpq)/bin:$PATH"` to `~/.zshrc`, then `source ~/.zshrc` or open a new terminal, then start `bun run dev`.
- **tippecanoe**
  - Used: static-dataset PMTiles on the laptop. See [StaticDatasets README](./scripts/StaticDatasets/README.md).
  - Install: `brew install tippecanoe`

Linux: `eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"` puts `brew` (and `gdal` / `tippecanoe`) on PATH ([Homebrew on Linux](https://docs.brew.sh/Homebrew-on-Linux)). `libpq` is still keg-only — use the PATH line above for `pg_restore`.

Note: `pg_dump` and `psql` are not on this list. `data-schema-publish` and `db-pull` run them in Docker, so you do not install those on the host.

### Our Tooling

- Framework: [TanStack Start](https://tanstack.com/start) (Vite + TanStack Router + Nitro) with React 19
- URL State Management: TanStack Router `validateSearch` (Zod) + [`regionSearchSchemas.ts`](../app/src/shared/regionen/regionSearchSchemas.ts); throttled updates via [`@tanstack/react-pacer`](https://tanstack.com/pacer/latest)
- ORM: [Prisma](https://www.prisma.io/)
- Styling: [Tailwind CSS](https://tailwindcss.com/), [Tailwind UI](https://tailwindui.com/) and [Headless UI](https://headlessui.com/)

### Supported browsers

Market-share queries in [`package.json`](./package.json) `browserslist`; wired to [`vite.config.ts`](./vite.config.ts) (client build) and [`oxlint.config.mjs`](./oxlint.config.mjs) (client API lint).

**How it works:** [browser-target skill](https://github.com/FixMyBerlin/fixmyskills/blob/main/skills/browser-target/SKILL.md)

### Running the production bundle locally

1. Ensure `bun run dev` works.
2. Check [`.env.production`](./.env.production) if you use it for local preview.
3. Run `bun run build` and `bun run start` to test the production bundle.

Dockerized frontend:

```
docker compose --profile frontend build
docker compose --profile frontend up
```

## Helper scripts

All [helper scripts](./scripts) run with [bun](https://bun.sh/).

- **Update mapbox styles** – See [/scripts/MapboxStyles/README.md](./scripts/MapboxStyles/README.md).
- **Update datasets** – See [/datasets/README.md](./datasets/README.md) (or StaticDatasets README) for processing and updating external datasets.
