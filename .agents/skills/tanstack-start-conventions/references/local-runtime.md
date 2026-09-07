# TanStack Start — Local runtime (Bun)

Production FMC Start apps run the Nitro server on **Bun** (`preset: bun`). Local `dev` / `start` / `preview` must see the same runtime so SSR and server code do not silently diverge onto Node.

**General Bun install / `bun --bun` / `.nvmrc`:** skill `tech-stack` → [bun-install.md](../../tech-stack/references/bun-install.md). This page is Start-only script shape.

## Scripts

Force Bun when invoking Vite and when running the Nitro output (Vite’s shebang otherwise lands on Node):

```json
{
  "scripts": {
    "dev": "FORCE_COLOR=1 bun --bun vite dev --host 127.0.0.1 --port 4000",
    "build": "vite build",
    "start": "bun --bun .output/server/index.mjs",
    "preview": "NITRO_HOST=127.0.0.1 NITRO_PORT=4000 bun --bun .output/server/index.mjs"
  }
}
```

Monorepos that split Vite into a group step (tilda-geo): `dev:vite` uses `bun --bun vite dev …`; `preview` runs `.output/server/index.mjs` under Bun. Naming of `start` vs `preview` may differ per repo — the rule is the **Nitro server entry** runs with Bun.

## `.nvmrc` / Node still needed

Prisma and Playwright spawn **Node**. Keep `.nvmrc` and document `nvm use` in the app README (TILDA wording: they spawn Node; `bun run dev` uses Bun). That does not replace `bun --bun` for Vite/Nitro.
