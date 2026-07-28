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

**Why `127.0.0.1` and not `localhost`?** See [Local Development Domain Setup](../docs/Local-Development-Domain-Setup.md).

**Worktrees and Docker:** See [Docker local development](../docs/docker-local-development.md). Work branches use short names like `my-branch`: `bun run setup-worktree -- my-branch` then `bun run dev` in the new folder.

### Start

Run `nvm use` to use the recommended Node version.

Run `bun run dev`. Open **http://127.0.0.1:5173** in your browser. Docker and dependencies start automatically if needed.

### Our Tooling

- Framework: [TanStack Start](https://tanstack.com/start) (Vite + TanStack Router + Nitro) with React 19
- URL State Management: [nuqs](https://github.com/47ng/nuqs)
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
- **Update regional masks** – See [/scripts/RegionalMasks/README.md](./scripts/RegionalMasks/README.md).
- **Update datasets** – See [/datasets/README.md](./datasets/README.md) (or StaticDatasets README) for processing and updating external datasets.
