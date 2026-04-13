# `app` README

## Monorepo

Please read the [README](../README.md) first.

## About

The frontend visualizes our processed data it also provides options to annotate and export the data.

## Development

### Initial setup

1. Create a `/.env` file in the **repository root** based on [`/.env.example`](../.env.example). That is the only env file you need for local app dev; scripts under `app/` load it with `bun --env-file=../.env` (see [`package.json`](./package.json)).
2. Set `VITE_APP_ORIGIN=http://127.0.0.1:5173` (and `VITE_APP_ENV=development`). No `/etc/hosts` or certificates needed.
3. To test the login, set up your own OSM OAuth 2 application (see [osm-auth](https://github.com/osmlab/osm-auth#registering-an-application)) and add credentials to the root `.env`.

**Why `127.0.0.1` and not `localhost`?** See [Local Development Domain Setup](../docs/Local-Development-Domain-Setup.md).

### Start

Run `nvm use` to use the recommended Node version.

Run `bun run dev`. Open **http://127.0.0.1:5173** in your browser. Docker and dependencies start automatically if needed.

### Our Tooling

- Framework: [TanStack Start](https://tanstack.com/start) (Vite + TanStack Router + Nitro) with React 19
- URL State Management: [nuqs](https://github.com/47ng/nuqs)
- ORM: [Prisma](https://www.prisma.io/)
- Styling: [Tailwind CSS](https://tailwindcss.com/), [Tailwind UI](https://tailwindui.com/) and [Headless UI](https://headlessui.com/)

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
