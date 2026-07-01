---
name: tanstack-start-auth
description: >-
  Better Auth on TanStack Start: betterAuth() config, plugins, adapters, sessions,
  and FMC route protection (layout beforeLoad for route UX, endpointAuth/guards
  for data boundaries, headers, manual cookies, OAuth sign-in).
  Use for auth.ts, Better Auth, sign-in flows, session helpers, or secured routes/APIs.
disable-model-invocation: true
---

# TanStack Start + Better Auth

Single skill for **library configuration** and **Start-specific wiring** in FMC apps (TILDA, Trassenscout migration, etc.).

## When to apply

- Creating or changing `betterAuth()` / `createAuthClient()` config
- Mounting `/api/auth/*`, cookie forwarding, OAuth sign-in routes
- `beforeLoad` gates, `endpointAuth`, session in server functions or API handlers
- Public vs protected server functions (`public*.functions.ts` naming)
- API key + session dual auth on automation endpoints

## References (read as needed)

| Topic                                                     | File                                                                 |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| TanStack routes, cookies, session helpers, TILDA patterns | [references/auth.md](references/auth.md)                             |
| Trassenscout auth lint pattern                            | [references/endpoint-auth-lint.md](references/endpoint-auth-lint.md) |
| betterAuth options, DB, plugins, sessions, hooks          | [references/better-auth-config.md](references/better-auth-config.md) |

**Live docs:** [better-auth.com/docs](https://better-auth.com/docs) · [llms.txt](https://better-auth.com/llms.txt)

## Related skills

- `tanstack-start-conventions` — layout, `.server.ts` / `.functions.ts`, boundaries, SSR
- `playwright-skill` — E2E stubbed auth (TILDA)

## Non-negotiable rules

1. Session helpers always receive `headers: Headers` from the current request.
2. Route `beforeLoad` does not call DB/session directly — server functions + `getRequestHeaders()`.
3. **Do not** add `tanstackStartCookies()` in FMC apps — use `forwardAuthAndApplyCookies` ([auth.md](references/auth.md)).
4. `/api/auth/$` and other handler-only API routes: `ssr: false` ([selective-ssr.md](../tanstack-start-conventions/references/selective-ssr.md)).
5. API routes: auth inside each handler (no route-level `beforeLoad`).
6. Admin/role checks with cookie cache: `getSession({ query: { disableCookieCache: true } })`.
7. Compare API secrets with timing-safe equality.
8. **Two layers:** `beforeLoad` = route UX only; `endpointAuth` / guards = data boundary. Never rely on `beforeLoad` alone.
9. **No auth middleware for route guarding** — use layout `beforeLoad`. Global auth middleware breaks public RPCs (`public*.functions.ts`, `getSessionForRouteFn`) and is not the FMC auth-route pattern.

## Quick patterns

```ts
// beforeLoad (via server fn)
await routeSessionFn({ data: location })

// API handler
const session = await endpointAuth.session(request.headers)

// Server function
const headers = getRequestHeaders()
await endpointAuth.admin(headers)
```

## Setup snapshot

1. `betterAuth()` in `auth.server.ts` (Prisma/Drizzle adapter, plugins)
2. `createAuthClient()` with matching client plugins
3. `/api/auth/$` → `forwardAuthAndApplyCookies(request)`
4. `session.server.ts` helpers taking `Headers`
5. CLI migrate/generate after plugin changes — details in [better-auth-config.md](references/better-auth-config.md)
