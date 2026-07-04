---
name: playwright-skill
description: E2E testing and browser automation for TanStack Start apps (FMC/TILDA). Use @playwright/test for committed suites/CI; agent-browser MCP (skill tech-stack) for agent exploration; this skill for smoke tests, stubbed auth, map hooks, and quick /tmp scripts. Not for Next.js.
---

**Path resolution:** Discover `$SKILL_DIR` from where this file was loaded (plugin, global `~/.claude/skills/`, or project `.agents/skills/`).

**Read the project’s `tests/README.md` first** — env vars, Docker, and scripts live there.

**Related FMC skills:** `tanstack-start-migration` (post-migration smoke), `tanstack-start-auth` (sessions), `tanstack-start-conventions`.

---

## Official docs (fetch; do not duplicate)

Playwright has **no** official `llms.txt` ([request closed](https://github.com/microsoft/playwright/issues/39895)).

| Topic                        | URL                                                                 |
| ---------------------------- | ------------------------------------------------------------------- |
| Intro & writing tests        | https://playwright.dev/docs/intro                                   |
| Locators (`getByRole`, etc.) | https://playwright.dev/docs/locators                                |
| Test configuration           | https://playwright.dev/docs/test-configuration                      |
| Best practices               | https://playwright.dev/docs/best-practices                          |
| CI                           | https://playwright.dev/docs/ci                                      |
| Agents (CLI)                 | https://playwright.dev/docs/getting-started-cli                     |
| TanStack doc index           | https://tanstack.com/llms.txt                                       |
| TanStack Start e2e examples  | https://github.com/TanStack/router/tree/main/e2e/react-start        |
| Map interactions (optional)  | https://mapgrab.github.io/docs/getting-started/stage-two/playwright |

---

## Three layers (pick the right tool)

| Layer                   | When                                                          | Where                                                                                                             |
| ----------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Project E2E**         | Suites, CI, regression                                        | `@playwright/test` in `tests/*.spec.ts`, repo `playwright.config.ts`                                              |
| **Agent exploration**   | Interactive debugging, hydration, React tree, quick UI checks | **agent-browser MCP** — skill `tech-stack`, [agent-browser-mcp.md](../tech-stack/references/agent-browser-mcp.md) |
| **Ad-hoc** (this skill) | One-off scripts, external sites, no MCP                       | `/tmp/playwright-test-*.js` via `run.js`                                                                          |

For in-repo work, **prefer project E2E** for anything that should regress. Use **agent-browser MCP** for interactive debugging — setup and usage in skill `tech-stack` ([agent-browser-mcp.md](../tech-stack/references/agent-browser-mcp.md)). Use ad-hoc scripts for one-off work outside MCP or without committing tests.

### Boundaries (Playwright vs agent-browser)

| Concern                                      | `@playwright/test` (this skill)                 | agent-browser (tech-stack)    |
| -------------------------------------------- | ----------------------------------------------- | ----------------------------- |
| Regression, CI, stubbed auth, map test hooks | ✓                                               | —                             |
| Hydration, React tree, quick UI debugging    | —                                               | ✓                             |
| Maps (WebGL)                                 | `waitForMapLoad`, tile/network helpers, MapGrab | Annotated screenshots, `eval` |

Exploration findings that should stick → add `tests/*.spec.ts` and run `bun run e2e`.

---

## TanStack Start — `playwright.config.ts`

Reference implementation: **tilda-geo** `app/playwright.config.ts`.

### Environment loading

Load env **before** `defineConfig` so `webServer` gets `DATABASE_*` etc.:

```typescript
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') }) // repo
dotenv.config({ path: path.resolve(__dirname, '.env') }) // app (optional)
dotenv.config({ path: path.resolve(__dirname, '.env.test') }) // test-only
```

### Server tiers

| Tier              | Use                           | `webServer.command`                         | Notes                                                                                                             |
| ----------------- | ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Local / smoke** | Fast feedback (TILDA default) | `bun run dev`                               | Vite dev, e.g. `http://127.0.0.1:5173`                                                                            |
| **CI / release**  | Production-like               | `bun run build && bun run start`            | Set `PORT` / `VITE_SERVER_PORT` like [TanStack e2e](https://github.com/TanStack/router/tree/main/e2e/react-start) |
| **Preview**       | Built assets + SSR preview    | `bun run build && bun run preview --port …` | TanStack `vite preview` mode                                                                                      |

**Docker / DB:** If the app needs Postgres or tiles, start compose **outside** Playwright (`docker compose up db tiles -d`). Do not cram compose into `webServer.command` unless CI already proves it works.

**Shared DB:** Use `workers: 1` or `test.describe.configure({ mode: 'serial' })` when tests create/delete the same DB rows (stubbed auth).

### Minimal config (TILDA-style smoke)

```typescript
import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'bun run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
```

Copy the full template from `playwright.config.ts.template` in this skill directory.

---

## FMC / TILDA patterns

Canonical paths in **tilda-geo** (`app/`):

| Concern                     | Location                                          |
| --------------------------- | ------------------------------------------------- |
| Config                      | `playwright.config.ts`                            |
| Setup docs                  | `tests/README.md`                                 |
| Smoke (public routes)       | `tests/smoke/public-routes.spec.ts`               |
| Smoke (trailing slash)      | `tests/smoke/trailing-slash-redirect.spec.ts`     |
| Smoke (region `beforeLoad`) | `tests/smoke/region-before-load.spec.ts`          |
| Stubbed admin / role auth   | `tests/pages/admin.stubbed-auth.spec.ts`          |
| Regions + map (real OAuth)  | `tests/pages/regions.spec.ts` (`RUN_OAUTH_E2E=1`) |
| Docs region downloads       | `tests/pages/docs-region-downloads.spec.ts`       |
| Contact profile modal       | `tests/pages/contact-profile-modal.spec.ts`       |
| Auth fixtures               | `tests/fixtures/auth.ts`                          |
| Route lists                 | `tests/fixtures/routes.ts`                        |
| Console / server errors     | `tests/utils/console.ts`, `tests/utils/server.ts` |
| Map wait / render helpers   | `tests/utils/maps.ts`                             |
| Map network verification    | `tests/utils/network.ts`                          |
| Dynamic URL regex escape    | `tests/utils/regex.ts`                            |
| App test hooks              | `src/components/shared/utils/playwright.ts`       |

### `VITE_PLAYWRIGHT_ENABLED`

In repo `.env` (see `.env.example`):

```bash
VITE_PLAYWRIGHT_ENABLED=true
```

Enables test IDs and map signals **only** in E2E — not in production HTML.

### App hooks (`playwright.ts`)

```typescript
import { createIsomorphicFn } from '@tanstack/react-start'

export function playwrightTestId(testId: string) {
  return import.meta.env.VITE_PLAYWRIGHT_ENABLED === 'true' ? testId : undefined
}

export const exposeMainMapForDebugging = createIsomorphicFn()
  .server((_map?: MaplibreMap) => {})
  .client((map?: MaplibreMap) => {
    const playwrightEnabled =
      import.meta.env.VITE_PLAYWRIGHT_ENABLED === 'true' || window.__PLAYWRIGHT_ENABLED === 'true'
    if (import.meta.env.DEV || playwrightEnabled) {
      window.__mainMap = map
    }
  })

export const firePlaywrightMapLoadedEvent = createIsomorphicFn()
  .server(() => {})
  .client(() => {
    const playwrightEnabled =
      import.meta.env.VITE_PLAYWRIGHT_ENABLED === 'true' || window.__PLAYWRIGHT_ENABLED === 'true'
    if (!playwrightEnabled) return
    window.dispatchEvent(new CustomEvent('mapLoaded'))
    window.__mapLoaded = true
  })
```

Call both helpers from the map `onLoad` handler: `exposeMainMapForDebugging(event.target)` and `firePlaywrightMapLoadedEvent()`. `window.__mainMap` is available in dev and Playwright mode; the `mapLoaded` event remains Playwright-gated. Why expose the map and `onLoad` wiring: skill `react-map-gl` → [map-debug-exposure.md](../react-map-gl/references/map-debug-exposure.md). Tests use `tests/utils/maps.ts` (`waitForMapLoad`, `verifyMapRendered`, `checkMapTilesLoaded`, `getMapLayerIds`). For tile/API coverage on region pages, use `verifyMapNetworkRequests` from `tests/utils/network.ts` (after `waitForMapLoad`).

For **click/drag on map canvas**, consider [MapGrab](https://mapgrab.github.io/docs/getting-started/stage-two/playwright) (used in legacy Trassenscout surveys; adopt when migrating those flows to Start).

### Smoke tests (post-migration)

After **Next → TanStack Start**, add or run smoke specs:

1. `page.goto(route)` with `baseURL`
2. Assert pathname unchanged (no crash redirect)
3. `expect(page.locator('main').first()).toBeVisible()`
4. `expectNoConsoleErrors(page)` (see utils)

Route lists live in `tests/fixtures/routes.ts` (`PUBLIC_SMOKE_ROUTES`, `ADMIN_ROUTES`, `ADMIN_REDIRECT_SMOKE_ROUTE`, etc.). Run: `bun run e2e -- tests/smoke`.

Additional smoke specs (no OAuth):

- **Trailing slash:** `trailing-slash-redirect.spec.ts` — `__root` `beforeLoad` strips slashes (`trailingSlash: 'never'`); public routes + stubbed admin for `/admin/`.
- **Region `beforeLoad`:** `region-before-load.spec.ts` — catch invalid `URL` construction errors on region pages with search params.

### Auth

| Strategy          | When                         | TILDA                                                                                           |
| ----------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| **Stubbed admin** | Admin pages, search-param UI | `createStubbedAdminSession(page, baseURL, { identityKey })` — Better Auth cookies + Prisma user |
| **Stubbed user**  | Non-admin / modal flows      | `createStubbedUserSession(page, baseURL, { identityKey })`                                      |
| **Real OAuth**    | Map + regions regression     | `auth-setup.spec.ts` + `regions.spec.ts` when `RUN_OAUTH_E2E=1` + `TEST_OSM_*` in `.env.test`   |

**Parallel safety:** Stubbed admin suites use `mode: 'serial'` and **nested** `test.describe` per route so `afterEach` cleanup does not delete another worker’s session (`cleanupStubbedSessionData('ADMIN' | 'USER', identityKey)`).

**Dynamic URLs:** Use `escapeRegExp(route)` from `tests/utils/regex.ts` when building `toHaveURL(new RegExp(...))` from fixture paths that may contain `?` or special characters.

### Quality helpers

Before `goto`, attach collectors; after navigation, assert:

- **Console:** `collectConsoleErrors` → filter `KNOWN_ACCEPTABLE_ERRORS` → fail on `error`
- **Server:** `collectServerErrors(page, baseURL)` — same-origin 5xx and `requestfailed`

Extend allowlists in the util files when a known benign error appears.

### Locators

Prefer `getByRole`, `getByLabel`, `getByText`. Use `playwrightTestId('…')` only when roles are insufficient. Avoid brittle CSS chains.

---

## Project E2E workflow

**`package.json` script** (TILDA convention):

```json
"e2e": "playwright test --project=chromium"
```

- `bun run e2e` → chromium project (default local/CI run)
- `bun run e2e -- --ui` / `bun run e2e -- --debug` → pass Playwright flags after `--`
- `bun run e2e -- tests/smoke` → subset of specs

```bash
bun add -d @playwright/test dotenv
bunx playwright install chromium
# Start DB/tiles if required (see tests/README.md)
bun run e2e
bun run e2e -- tests/smoke
bun run e2e -- --ui
bun run e2e -- --debug
```

Write tests in `tests/**/*.spec.ts` with TypeScript. Use web-first assertions (`expect(locator).toBeVisible()`).

---

## Ad-hoc automation (skill runner)

**Setup (once):**

```bash
cd $SKILL_DIR && bun run setup
```

**Workflow:**

1. For localhost: detect dev servers first:

   ```bash
   cd $SKILL_DIR && bun -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"
   ```

2. Write script to `/tmp/playwright-test-*.js` (never commit ad-hoc scripts to the skill dir).
3. Parameterize `TARGET_URL` at the top.
4. Run: `cd $SKILL_DIR && bun run.js /tmp/playwright-test-*.js`

**Headers** (identify automated traffic):

```bash
PW_HEADER_NAME=X-Automated-By PW_HEADER_VALUE=playwright-skill \
  cd $SKILL_DIR && bun run.js /tmp/my-script.js
```

Multiple headers: `PW_EXTRA_HEADERS='{"X-Automated-By":"playwright-skill"}'`.

**Defaults:** Use `headless: false` for ad-hoc unless the user asks for headless. Prefer semantic locators in ad-hoc scripts too.

**Helpers** (`lib/helpers.js`): `detectDevServers`, `createContext` / `getExtraHeadersFromEnv`, `takeScreenshot`. Avoid custom retry click helpers — use Playwright auto-waiting.

---

## Checklist (new Start app E2E)

- [ ] `playwright.config.ts` with layered dotenv and `baseURL` matching Vite port
- [ ] `tests/README.md` documents compose, `.env.test`, and bun scripts
- [ ] `VITE_PLAYWRIGHT_ENABLED` + `src/.../playwright.ts` hooks
- [ ] `tests/smoke/` for public routes (+ trailing-slash / `beforeLoad` edge cases)
- [ ] Stubbed auth fixtures if admin or role-gated routes need login
- [ ] `collectConsoleErrors` / `collectServerErrors` on critical suites
- [ ] Map: `mapLoaded` event + `waitForMapLoad` + optional `verifyMapNetworkRequests` (MapGrab if clicking the map)

---

## When to use what

| Need                             | Tool                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Committed regression / CI        | `@playwright/test` in repo                                                      |
| Post–TanStack Start smoke        | `tests/smoke/` + this skill                                                     |
| Agent debugging (SSR, React, UI) | agent-browser MCP — [tech-stack](../tech-stack/references/agent-browser-mcp.md) |
| Quick screenshot / external site | Ad-hoc `run.js` or agent-browser                                                |
| DB schema / queries              | Postgres MCP — [tech-stack](../tech-stack/references/cursor-mcp.md)             |
