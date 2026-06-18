---
name: tech-stack
description: >-
  Default FMC tech stack for geo-heavy React SPAs: Bun/Vite, React 19, TanStack,
  maps, styling, tsconfig templates, browserslist client targets, and when to
  pick sibling skills. Use when scaffolding a new app, evaluating libraries,
  changing supported browsers or compat lint, or making stack/architecture
  decisions on existing apps.
---

# FMC tech stack

Default stack for **geo-heavy React SPAs** at FixMyBerlin / FMC. Use for tech decisions when **creating** or **changing** an app — not as a deep dive into any one library.

Install sibling skills separately: `bunx skills add FixMyBerlin/fixmyskills --skill <name> -a cursor -y`

## When to apply

- Greenfield app scaffold (dependencies, tooling, folder layout)
- Library or pattern choice (“should we use X?”)
- Cross-cutting convention review on an existing app

## LLM resources

Load [references/llm-resources.md](references/llm-resources.md) **only for the area the task touches**.

**Maps:** load skill `react-map-gl` (and upstream [React Map GL docs](https://visgl.github.io/react-map-gl/) when the skill points there).

## Specialized skills

Prefer installed skill names when present; otherwise fetch from git.

| Area                                      | Skill                          | GitHub                                                                                                                         |
| ----------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Rust/WASM geo                             | `rust-wasm-geo`                | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/rust-wasm-geo>                                                    |
| Maps (react-map-gl)                       | `react-map-gl`                 | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/react-map-gl>                                                     |
| React TS patterns                         | `react-dev`                    | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/react-dev>                                                        |
| useEffect discipline                      | `react-useeffect`              | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/react-useeffect>                                                  |
| TanStack Start (boundaries, SSR, loaders) | `tanstack-start-conventions`   | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/tanstack-start-conventions>                                       |
| Router search params (UI routes)          | —                              | <https://github.com/FixMyBerlin/fixmyskills/blob/main/skills/tanstack-start-conventions/references/params-search-ui-vs-api.md> |
| Router + Query loaders                    | —                              | <https://github.com/FixMyBerlin/fixmyskills/blob/main/skills/tanstack-start-conventions/references/router-and-query.md>        |
| Devtools debug panel                      | —                              | <https://github.com/FixMyBerlin/fixmyskills/blob/main/skills/tanstack-start-conventions/references/devtools.md>                |
| App folder layout                         | `tanstack-start-app-structure` | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/tanstack-start-app-structure>                                     |
| URL state (Next.js / shared libs)         | `nuqs`                         | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/nuqs>                                                             |
| Client global state                       | `zustand-state-management`     | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/zustand-state-management>                                         |
| E2E / Playwright                          | `playwright-skill`             | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/playwright-skill>                                                 |
| Next → Start migration                    | `tanstack-start-migration`     | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/tanstack-start-migration>                                         |

## Runtime and build

- **Runtime / package manager:** [Bun](https://bun.sh)
- **Build:** latest Vite (8+)
- **Bun security:** `minimumReleaseAge = 5` in `bunfig.toml` (432000 seconds)
- **Lint / format:** oxlint and oxfmt with fix flags; Prettier-compatible defaults:
  - class sorting, import sorting, `package.json` sorting
  - `printWidth` 100, semicolons `asNeeded`, single quotes
  - `'typescript/switch-exhaustiveness-check': 'error'`
  - Templates: [examples/oxfmt.config.mjs](examples/oxfmt.config.mjs), [examples/oxlint.config.mjs](examples/oxlint.config.mjs)
  - Setup and per-project tuning: [references/oxc-config.md](references/oxc-config.md)
- **Client browser target:** `browserslist` in `package.json` drives Vite client `build.target` and `eslint-plugin-compat` in oxlint — [references/browser-target.md](references/browser-target.md)

## React and TypeScript

- **UI:** React 19
- **TypeScript:** latest **Go** implementation (`@typescript/native-preview` / `tsgo`) — not legacy `tsc`. Typecheck with `tsgo --noEmit`.
- **React Compiler:** on by default — see skill `react-dev` for memoization and typing conventions
- **GeoJSON:** `@types/geojson` for all GeoJSON payloads
- **Dates / times:** `@date-fns/tz`
- **Validation:** Zod 4

### tsconfig templates

Use **two profiles** — do not merge app and scripts into one config.

| Profile                   | Template                                                         | Profile analogue                  |
| ------------------------- | ---------------------------------------------------------------- | --------------------------------- |
| App (DOM, TanStack Start) | [examples/tsconfig.app.json](examples/tsconfig.app.json)         | total-typescript `bundler/dom`    |
| Scripts (CLI, no DOM)     | [examples/tsconfig.scripts.json](examples/tsconfig.scripts.json) | total-typescript `bundler/no-dom` |

Copy and adapt on scaffold. Adjust `paths` to project layout (`./src/*` vs `./*`). Add `allowJs: true` only when the repo still has `.js` files.

**TanStack Start (app only):** `verbatimModuleSyntax: false` — type-only imports can become empty runtime imports and leak server code into client bundles. See header comments in `tsconfig.app.json`.

**Never** install or `extends` `@total-typescript/tsconfig` — keep settings inlined with deviation comments.

**Typecheck:**

```bash
tsgo --noEmit -p tsconfig.app.json && tsgo --noEmit -p tsconfig.scripts.json
```

Single-config repos (e.g. one root `tsconfig.json` covering app + scripts) are acceptable; greenfield TanStack Start apps should prefer split configs.

Optional root `tsconfig.json` with `"references"` to both child configs.

**ES2025:** `target` and `lib` stay in sync. `lib` adds typings only; new ES2025 **runtime** APIs in client bundles are not auto-polyfilled — use deliberately on the client; fine on server/Bun/scripts. Which browsers get that client bundle: [references/browser-target.md](references/browser-target.md).

Component typing, Compiler, and oxlint React rules: skill `react-dev`.

## useEffect

Load skill `react-useeffect` for when to skip Effect, naming, and alternatives. Map camera, clicks, and layers: skill `react-map-gl` (not `useEffect` + `map.on()`).

## Data and state

| Need                                        | Choice                                                                                                                                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server / async data                         | TanStack Query — no raw `useEffect` fetch; Suspense where the router supports it                                                                                                              |
| Forms (non-trivial)                         | TanStack Form                                                                                                                                                                                 |
| Routing                                     | TanStack Router / Start                                                                                                                                                                       |
| Shareable URL state (TanStack apps)         | Route `validateSearch` (Zod) — see [params-search-ui-vs-api.md](https://github.com/FixMyBerlin/fixmyskills/blob/main/skills/tanstack-start-conventions/references/params-search-ui-vs-api.md) |
| Shareable URL state (Next.js / shared libs) | nuqs — see skill `nuqs`                                                                                                                                                                       |
| Global client state                         | Zustand (tkdodo patterns) — skill `zustand-state-management`                                                                                                                                  |
| Local UI state                              | `useState`                                                                                                                                                                                    |

Loader + Query integration: [router-and-query.md](https://github.com/FixMyBerlin/fixmyskills/blob/main/skills/tanstack-start-conventions/references/router-and-query.md).

## Styling and UI

- **CSS:** Tailwind CSS, `@tailwindcss/forms`, `@tailwindcss/typography`
- **Class merging:** `tailwind-merge` with `twJoin`, `twMerge`
- **Fonts:** Fontsource imports
- **Accessibility:** semantic HTML; keyboard-accessible map controls; do not rely on color alone

## Maps and geo (JS)

Stack choices only — map component patterns, layers, events, URL viewport: skill `react-map-gl`.

| Choice          | Default                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Library         | `react-map-gl/maplibre` (not raw MapLibre in components)                                                                                                                                                                 |
| Basemap         | [OpenFreeMap](https://openfreemap.org/); Maptiler if required                                                                                                                                                            |
| Coordinates     | WGS84, `[lng, lat]` at API boundaries; validate with Zod                                                                                                                                                                 |
| Turf            | `@turf/*` per-function imports — not `import * as turf`                                                                                                                                                                  |
| Feature editing | [tilda-geo drawing](https://github.com/FixMyBerlin/tilda-geo/tree/develop/app/src/components/regionen/pageRegionSlug/Map/Calculator/drawing), [maplibre-gl-terradraw](https://github.com/watergis/maplibre-gl-terradraw) |

## Rust / WASM geo

Turf vs WASM, crates, Vite wiring: skill `rust-wasm-geo`.

## Dependency updates (Dependabot)

- Weekly Monday 07:00 Europe/Berlin; **one open PR at a time** per ecosystem (`open-pull-requests-limit: 1`).
- Template: [examples/dependabot.yml.template](examples/dependabot.yml.template)
- Grouping, monorepo tuning, and ignores: [references/dependabot.md](references/dependabot.md)

## Tests and quality

| Need                            | Skill / tool             |
| ------------------------------- | ------------------------ |
| Unit / component tests          | Vitest (always)          |
| Cross-route, map, or auth flows | `playwright-skill`       |
| Pure logic / utils only         | Vitest — skip Playwright |

## Quick decisions

```mermaid
flowchart TD
  start[Tech decision] --> maps{Maps involved?}
  maps -->|yes| reactMapGl[react-map-gl skill]
  maps -->|no| data{Server or URL state?}
  data -->|server| tanstackQuery[router-and-query.md]
  data -->|URL TanStack| validateSearch[params-search-ui-vs-api.md]
  data -->|URL Next/shared| nuqsSkill[nuqs skill]
  data -->|client global| zustandSkill[zustand-state-management]
  maps -->|slow geo compute| rustWasm[rust-wasm-geo skill]
```
