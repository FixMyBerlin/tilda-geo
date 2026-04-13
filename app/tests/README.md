# Playwright E2E Tests

## Setup

1. Install browsers: `bunx playwright install chromium` (Playwright is already a project dependency)
2. Configure: Create `app/.env.test` with `TEST_OSM_USERNAME` and `TEST_OSM_PASSWORD`
3. Configure app: Set `VITE_PLAYWRIGHT_ENABLED=true` in repo root `.env` (see `.env.example`). Vitest unit tests use the repo root `.env`; `app/.env.test` is Playwright-only.
4. For smoke tests only: `bun run test-e2e` will start the dev server via `webServer` if not already running (requires `docker compose up db tiles -d` first if the app needs DB). For full suite: start app with `docker compose up db tiles -d && bun run dev`, then run tests.

## Usage

```bash
bun run test-e2e          # Run all tests (starts dev server if needed)
bun run test-e2e -- tests/smoke # Run only smoke tests (one per public route)
bun run test-e2e-ui       # UI mode
bun run test-e2e-debug    # Debug mode
```

## Smoke tests (autonomous)

`tests/smoke/public-routes.spec.ts` runs one unauthenticated smoke test per public route: page loads, no crash, no unexpected redirect, `main` visible, no console errors. Use for migration/regression (e.g. after Next → TanStack Start) or CI.

## Authentication

Run `auth-setup.spec.ts` first to create session. Other tests (admin, regions as logged-in) reuse stored session.

## Map Testing

Set `VITE_PLAYWRIGHT_ENABLED=true` to enable Playwright testing mode. This enables test IDs and the `mapLoaded` event. Tests wait for this event to verify map initialization.

## LLM Usage

Tests can be run autonomously to verify app quality:

- All pages render without errors
- Maps display correctly
- Network requests succeed
- No console errors

Use `bun run test-e2e` to evaluate app state. Tests are self-contained and can be run in CI/CD.
