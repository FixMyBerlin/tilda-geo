---
name: tanstack-start-auth
description: >-
  Better Auth on TanStack Start: betterAuth() config, plugins, adapters, sessions,
  and FMC route protection (beforeLoad, headers, manual cookies, OAuth sign-in).
  Use for auth.ts, Better Auth, sign-in flows, session helpers, or secured routes/APIs.
disable-model-invocation: true
---

# TanStack Start + Better Auth

Single skill for **library configuration** and **Start-specific wiring** in FMC apps (TILDA, Trassenscout migration, etc.).

## When to apply

- Creating or changing `betterAuth()` / `createAuthClient()` config
- Mounting `/api/auth/*`, cookie forwarding, OAuth sign-in routes
- `beforeLoad` gates, `requireAdmin`, session in server functions or API handlers
- API key + session dual auth on automation endpoints

## References (read as needed)

| Topic                                                     | File                                                                 |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| TanStack routes, cookies, session helpers, TILDA patterns | [references/auth.md](references/auth.md)                             |
| betterAuth options, DB, plugins, sessions, hooks          | [references/better-auth-config.md](references/better-auth-config.md) |

**Live docs:** [better-auth.com/docs](https://better-auth.com/docs) · [llms.txt](https://better-auth.com/llms.txt)

## Related skills

- `tanstack-start-conventions` — `.server.ts` / `.functions.ts`, boundaries, SSR
- `tanstack-start-app-structure` — `src/server/auth/` layout
- `playwright-skill` — E2E stubbed auth (TILDA)

## Non-negotiable rules

1. Session helpers always receive `headers: Headers` from the current request.
2. Route `beforeLoad` does not call DB/session directly — server functions + `getRequestHeaders()`.
3. **Do not** add `tanstackStartCookies()` in FMC apps — use `forwardAuthAndApplyCookies` ([auth.md](references/auth.md)).
4. API routes: auth inside each handler (no route-level `beforeLoad`).
5. Admin/role checks with cookie cache: `getSession({ query: { disableCookieCache: true } })`.
6. Compare API secrets with timing-safe equality.

## Quick patterns

```ts
// beforeLoad (via server fn)
const session = await getSessionForRouteFn()
if (!session) throw redirect({ to: '/api/sign-in/osm', search: { callbackURL: location.href } })

// API handler
const session = await getAppSession(request.headers)

// Server function
const headers = getRequestHeaders()
await requireAdmin(headers)
```

## Setup snapshot

1. `betterAuth()` in `auth.server.ts` (Prisma/Drizzle adapter, plugins)
2. `createAuthClient()` with matching client plugins
3. `/api/auth/$` → `forwardAuthAndApplyCookies(request)`
4. `session.server.ts` helpers taking `Headers`
5. CLI migrate/generate after plugin changes — details in [better-auth-config.md](references/better-auth-config.md)
