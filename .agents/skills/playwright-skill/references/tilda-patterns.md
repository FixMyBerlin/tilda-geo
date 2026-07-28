# TILDA Playwright patterns (reference)

Canonical repo: **tilda-geo** `app/`. Trassenscout will align with these patterns when migrated to TanStack Start.

## Scripts

From `app/package.json` (typical):

- `e2e` → `playwright test --project=chromium`
- `e2e -- --ui` / `e2e -- --debug` → pass Playwright flags after `--`
- `e2e -- tests/smoke` → run a subset of specs

## Environment

| File              | Purpose                                                           |
| ----------------- | ----------------------------------------------------------------- |
| Repo `.env`       | `VITE_PLAYWRIGHT_ENABLED=true`, DB, app config                    |
| `app/.env.test`   | `TEST_OSM_USERNAME`, `TEST_OSM_PASSWORD` (OAuth setup only)       |
| `RUN_OAUTH_E2E=1` | Gate real OSM login in `auth-setup.spec.ts` and `regions.spec.ts` |

Vitest uses repo `.env`; `app/.env.test` is Playwright-only.

## Smoke suite (`tests/smoke/`)

| Spec                              | Purpose                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `public-routes.spec.ts`           | One test per `PUBLIC_SMOKE_ROUTES` entry + unauthenticated `/admin` redirect |
| `trailing-slash-redirect.spec.ts` | Canonical paths when visiting URLs with trailing slashes                     |
| `region-before-load.spec.ts`      | Region pages with search params do not throw `URL` construction errors       |

## Stubbed session flow

1. `createStubbedAdminSession` or `createStubbedUserSession(page, baseURL, { identityKey })` — Prisma user + signed Better Auth cookies.
2. `collectConsoleErrors` / `collectServerErrors` before `goto`.
3. Assert `main` visible and no blocking errors.
4. `cleanupStubbedSessionData('ADMIN' | 'USER', identityKey)` in route-scoped `afterEach`.

Use `mode: 'serial'` and nested `test.describe` per route when tests share the DB.

## Map

1. App: call `exposeMainMapForDebugging(event.target)` and `firePlaywrightMapLoadedEvent()` on map load; `__mainMap` is dev/Playwright, `mapLoaded` is Playwright-only.
2. Test: `waitForMapLoad(page)` listens for `mapLoaded` or falls back to `.maplibregl-canvas`.
3. Optional: `getMapLayerIds(page)` reads `window.__mainMap.getStyle().layers` for layer-order assertions.
4. Optional: `verifyMapRendered(page)`, then `verifyMapNetworkRequests(page)` for tile/API coverage (`regions.spec.ts`).

## Route fixtures

`tests/fixtures/routes.ts` exports:

- `PUBLIC_SMOKE_ROUTES` — unauthenticated smoke list (includes docs topic with `?r=`, OAuth error page, preview routes)
- `ADMIN_ROUTES`, `ADMIN_REDIRECT_SMOKE_ROUTE`
- `TEST_REGION_URL`, `TEST_REGION_URL_WITH_CONFIG` — map-heavy region URLs

Use `escapeRegExp` from `tests/utils/regex.ts` for dynamic `toHaveURL` assertions.
