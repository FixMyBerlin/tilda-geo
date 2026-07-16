---
name: tech-stack
description: >-
  Default FMC tech stack for geo-heavy React SPAs: Bun/Vite, React 19, TanStack,
  maps, styling, TypeScript editor/CLI alignment, tsconfig templates,
  browserslist client targets, Cursor MCP (Postgres, agent-browser), and
  when to pick sibling skills. Use when scaffolding a new app, evaluating
  libraries, setting up Bun install/global store or Knip, changing supported
  browsers or compat lint, setting up Cursor MCP, or making stack/architecture
  decisions on existing apps.
---

# FMC tech stack

Default stack for **geo-heavy React SPAs** at FixMyBerlin / FMC. Use for tech decisions when **creating** or **changing** an app — not as a deep dive into any one library.

Install sibling skills separately: `bunx skills add FixMyBerlin/fixmyskills --skill <name> -a cursor -y`

## When to apply

- Greenfield app scaffold (dependencies, tooling, folder layout)
- Adding or renaming `package.json` scripts
- Library or pattern choice (“should we use X?”)
- Cross-cutting convention review on an existing app
- Cursor MCP setup for Postgres schema inspection, agent DB queries, or browser exploration MCP

## LLM resources

Load [references/llm-resources.md](references/llm-resources.md) **only for the area the task touches**.

**Maps:** load skill `react-map-gl` (and upstream [React Map GL docs](https://visgl.github.io/react-map-gl/) when the skill points there).

## Specialized skills

Prefer installed skill names when present; otherwise fetch from git.

| Area                                      | Skill                        | GitHub                                                                                                                         |
| ----------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Rust/WASM geo                             | `rust-wasm-geo`              | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/rust-wasm-geo>                                                    |
| Maps (react-map-gl)                       | `react-map-gl`               | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/react-map-gl>                                                     |
| React TS patterns, useEffect discipline   | `react-dev`                  | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/react-dev>                                                        |
| TanStack Start (boundaries, SSR, loaders) | `tanstack-start-conventions` | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/tanstack-start-conventions>                                       |
| Router search params (UI routes)          | —                            | <https://github.com/FixMyBerlin/fixmyskills/blob/main/skills/tanstack-start-conventions/references/params-search-ui-vs-api.md> |
| Router + Query loaders                    | —                            | <https://github.com/FixMyBerlin/fixmyskills/blob/main/skills/tanstack-start-conventions/references/router-and-query.md>        |
| Devtools debug panel                      | —                            | <https://github.com/FixMyBerlin/fixmyskills/blob/main/skills/tanstack-start-conventions/references/devtools.md>                |
| App folder layout                         | —                            | <https://github.com/FixMyBerlin/fixmyskills/blob/main/skills/tanstack-start-conventions/references/app-structure.md>           |
| URL state (TanStack Router apps)          | `tanstack-start-conventions` | `params-search-ui-vs-api.md`                                                                                                   |
| URL state (Next.js / legacy)              | `nuqs`                       | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/nuqs>                                                             |
| Client global state                       | `zustand-state-management`   | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/zustand-state-management>                                         |
| Prisma schema naming, migrations          | `prisma`                     | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/prisma>                                                           |
| E2E / Playwright                          | `playwright-skill`           | <https://github.com/FixMyBerlin/fixmyskills/tree/main/skills/playwright-skill>                                                 |

## Runtime and build

- **Runtime / package manager:** [Bun](https://bun.sh) — install policy [bun-install.md](references/bun-install.md) (≥ 1.3.14, global store, Vite dev)
- **Build:** latest Vite (8+)
- **Lint / format:** oxlint and oxfmt with fix flags; Prettier-compatible defaults:
  - class sorting, import sorting, `package.json` sorting
  - `printWidth` 100, semicolons `asNeeded`, single quotes
  - `'typescript/switch-exhaustiveness-check': 'error'`
  - React Compiler: native oxlint rule `'react/react-compiler': 'error'` on `**/*.tsx` (not `eslint-plugin-react-compiler`)
  - Templates: [examples/oxfmt.config.mjs](examples/oxfmt.config.mjs), [examples/oxlint.config.mjs](examples/oxlint.config.mjs)
  - Setup and per-project tuning: [references/oxc-config.md](references/oxc-config.md)
- **Client browser target:** `browserslist` in `package.json` drives Vite client `build.target` and `eslint-plugin-compat` in oxlint — [references/browser-target.md](references/browser-target.md)

## React and TypeScript

- **UI:** React 19
- **TypeScript (default):** `typescript@^7` (native port; [7.0 release](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)). Typecheck with `tsc --noEmit` via `bun run type-check`. The workspace `typescript` package provides both CLI (`tsc`) and editor language service — do not add a separate compiler binary for type-check. Nightlies: `typescript@next` (not the retired `@typescript/native-preview` package).
- **Editor/CLI alignment:** `js/ts.tsdk.path` must resolve to the same `devDependencies.typescript` install as `tsc` (package root, not `lib/`). Misalignment makes IDE diagnostics disagree with `bun run type-check`.
- **Scaffold (TS 7):** `package.json` — `devDependencies.typescript` `^7`, script `"type-check": "tsc --noEmit"` (add `-p` when using split tsconfigs); pin `@typescript/typescript-darwin-arm64` / `@typescript/typescript-linux-x64` in `optionalDependencies` at the same version when CI runs on a different platform than dev (the `typescript` package lists these as optional — extend for other platforms as needed). `bunfig.toml` — [bun-install.md](references/bun-install.md). Commit `.vscode/settings.json` (template: [examples/vscode.settings.typescript.json.template](examples/vscode.settings.typescript.json.template)) and recommend the **TypeScript 7** extension in `.vscode/extensions.json` ([examples/vscode.extensions.json.template](examples/vscode.extensions.json.template)).
- **Monorepos:** when TypeScript lives in a package subfolder, prefix `js/ts.tsdk.path` to that package’s `node_modules/typescript` (e.g. `app/node_modules/typescript` — [tilda-geo](https://github.com/FixMyBerlin/tilda-geo/blob/develop/.vscode/settings.json)).
- **Cursor / VS Code:** install **TypeScript 7** (`TypeScriptTeam.native-preview` — marketplace ID unchanged). Enable via command palette **TypeScript: Enable TypeScript 7** or the settings template. Copy [examples/vscode.settings.typescript.json.template](examples/vscode.settings.typescript.json.template) into `.vscode/settings.json` (merge with oxc keys from [references/oxc-config.md](references/oxc-config.md)). Toggle back with **Disable TypeScript 7 Language Server** when editor plugins still require TS 6 (Vue, Astro, Svelte, Angular templates — see release notes).
- **Tooling on TS 6 API:** TypeScript 7.0 has no programmatic compiler API. For typescript-eslint or similar, side-by-side TS 6 via `@typescript/typescript6` and npm aliases — see [release notes](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-60).
- **Cursor MCP (user-level):** `~/.cursor/mcp.json` only — [examples/mcp.json.template](examples/mcp.json.template). Postgres: [references/cursor-mcp.md](references/cursor-mcp.md). Browser exploration: [references/agent-browser-mcp.md](references/agent-browser-mcp.md). Never commit MCP config to a repo.
- **Cursor rules (app-level):** copy [examples/package-json-scripts.md.template](examples/package-json-scripts.md.template) → `.cursor/rules/package-json-scripts.md` on scaffold — [references/package-json-scripts.md](references/package-json-scripts.md)

**Verify:** `node -e "console.log(require('typescript/package.json').version)"`, `tsc --version`, and `bun run type-check` — all 7.x. In the editor, confirm **TypeScript 7** is enabled (status bar / command palette). Do not add `typescript` to repos that have no TS source (e.g. this skills monorepo).

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
tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.scripts.json
```

Single-config repos (e.g. one root `tsconfig.json` covering app + scripts) are acceptable; greenfield TanStack Start apps should prefer split configs.

Optional root `tsconfig.json` with `"references"` to both child configs.

**ES2025:** `target` and `lib` stay in sync. `lib` adds typings only; new ES2025 **runtime** APIs in client bundles are not auto-polyfilled — use deliberately on the client; fine on server/Bun/scripts. Which browsers get that client bundle: [references/browser-target.md](references/browser-target.md).

Component typing, Compiler, oxlint React rules, and useEffect discipline: skill `react-dev`. Map camera, clicks, and layers: skill `react-map-gl` (not `useEffect` + `map.on()`).

## Data and state

| Need                                | Choice                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| Server / async data                 | TanStack Query — no raw `useEffect` fetch; Suspense where the router supports it               |
| Forms (non-trivial)                 | TanStack Form                                                                                  |
| Routing                             | TanStack Router / Start                                                                        |
| Shareable URL state (TanStack apps) | Route `validateSearch` (Zod) — see `tanstack-start-conventions` → `params-search-ui-vs-api.md` |
| Shareable URL state (Next.js)       | nuqs — see skill `nuqs`                                                                        |
| High-frequency URL updates          | `@tanstack/react-pacer` — see <https://tanstack.com/pacer/latest>                              |
| Global client state                 | Zustand (tkdodo patterns) — skill `zustand-state-management`                                   |
| Local UI state                      | `useState`                                                                                     |
| Prisma schema / migrations          | skill `prisma` — naming, relation fields, migrate workflows                                    |

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
- **Reviewing and merging PRs:** skill `review-dependabot` (changelog triage, risk tiers, rebase merge)

## CI (GitHub Actions)

- PR dependency review: permissive `allow-licenses` (not deprecated `deny-licenses`) — template: [examples/ci.yml.template](examples/ci.yml.template)

## Tests and quality

| Need                            | Skill / tool                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Unit / component tests          | Vitest (always)                                                                                              |
| Cross-route, map, or auth flows | `playwright-skill`                                                                                           |
| Pure logic / utils only         | Vitest — skip Playwright                                                                                     |
| Explicit deps / dead exports    | [knip.md](references/knip.md) · verify scripts [package-json-scripts.md](references/package-json-scripts.md) |

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
