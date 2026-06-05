# Auth in TanStack Start (Better Auth)

Route mounting, cookies, session helpers, and protection patterns. For `betterAuth({ ... })` options, plugins, and DB adapters, see [better-auth-config.md](better-auth-config.md).

---

## 1. File layout (FMC)

| Role                  | Typical path                                                              |
| --------------------- | ------------------------------------------------------------------------- |
| Server config         | `src/server/auth/auth.server.ts`                                          |
| Cookie forwarder      | `src/server/auth/auth-route-handler.server.ts`                            |
| Session helpers       | `src/server/auth/session.server.ts`                                       |
| Server fns for routes | `src/server/auth/auth.functions.ts`                                       |
| Client                | `src/components/shared/auth/auth-client.ts` (or `src/lib/auth-client.ts`) |
| Auth API route        | `src/routes/api/auth.$.ts`                                                |
| Sign-in entry         | `src/routes/api/sign-in.<provider>.ts`                                    |

---

## 2. Mount handler and cookies

**Do not use `tanstackStartCookies()` in FMC TanStack Start apps** — it can pull `@tanstack/react-start/server` into the client bundle (Vite leak). Forward cookies manually in the auth API route.

```ts
// src/routes/api/auth.$.ts
import { createFileRoute } from '@tanstack/react-router'
import { forwardAuthAndApplyCookies } from '@/server/auth/auth-route-handler.server'

export const Route = createFileRoute('/api/auth/$')({
  ssr: true,
  server: {
    handlers: {
      GET: ({ request }) => forwardAuthAndApplyCookies(request),
      POST: ({ request }) => forwardAuthAndApplyCookies(request),
    },
  },
})
```

```ts
// auth-route-handler.server.ts — pattern
import { setCookie } from '@tanstack/react-start/server'
import { parseSetCookieHeader } from 'better-auth/cookies'
import { auth } from './auth.server'

export async function forwardAuthAndApplyCookies(request: Request) {
  const response = await auth.handler(request)
  const setCookieHeader = response.headers.getSetCookie().join(', ')
  if (!setCookieHeader) return response

  const parsed = parseSetCookieHeader(setCookieHeader)
  parsed.forEach((value, key) => {
    if (!key) return
    setCookie(key, decodeURIComponent(value.value), {
      sameSite: value.samesite,
      secure: value.secure,
      maxAge: value['max-age'],
      httpOnly: value.httponly,
      domain: value.domain,
      path: value.path,
    })
  })
  return response
}
```

Official docs may recommend `tanstackStartCookies()` as the last plugin — **FMC convention overrides that** for bundle safety.

---

## 3. Session helpers

All helpers take `headers: Headers` from the current request (`getRequestHeaders()` or `request.headers`).

```ts
export async function getSession(headers: Headers) {
  return auth.api.getSession({ headers })
}

export async function getFreshSession(headers: Headers) {
  return auth.api.getSession({
    headers,
    query: { disableCookieCache: true },
  })
}
```

Use **`getFreshSession`** (or equivalent) for **admin / role** checks when `session.cookieCache` is enabled.

Expose `getAppSession`, `requireAuth`, `requireAdmin` as thin wrappers returning app-shaped session (user id, role, etc.).

---

## 4. Sign-in and OAuth (FMC / TILDA)

- **Auth API:** `/api/auth/*` → `auth.handler`
- **User-facing sign-in:** dedicated route e.g. `/api/sign-in/osm` with `callbackURL` search param; `redirect({ to: '/api/sign-in/osm', search: { callbackURL: location.href } })`
- **Provider:** often `genericOAuth` + `genericOAuthClient`, not built-in `socialProviders` only
- **OAuth errors:** `onAPIError.errorURL` in `betterAuth` config → app error page (not default HTML at `/api/auth/error`)
- **Callback safety:** block dangerous `callbackURL` prefixes (`/api/auth`, `/api/sign-in`, error routes)

Client plugins must match server: `genericOAuthClient`, `customSessionClient`, `inferAdditionalFields<typeof auth>()`.

---

## 5. Where to enforce auth

- **Route-level:** `beforeLoad` on route definitions — not global middleware
- **Server-side only:** `auth.api.getSession({ headers })` — never client-only `useSession()` for access control
- **Patterns:**
  - **Redirect:** server fn in `beforeLoad` → `throw redirect({ to: signInUrl, search: { callbackURL } })`
  - **Soft gate:** `beforeLoad` returns `isAuthorized`; UI branches in page/loader
- **`beforeLoad` must not** call session/DB directly — use **server functions** that call `getRequestHeaders()` then session helpers (see `tanstack-start-conventions` → client-server-boundaries)

---

## 6. Typical protection matrix

| Area          | Protection        | Pattern                                                            |
| ------------- | ----------------- | ------------------------------------------------------------------ |
| Public home   | Optional redirect | `beforeLoad` reads post–sign-in cookie; no auth required           |
| Admin layout  | Admin only        | Parent `beforeLoad` + `getFreshSession` / `getIsAdminFn`           |
| Resource page | Public + member   | `beforeLoad` → `isAuthorized` in context                           |
| API routes    | Per-handler       | `getAppSession(request.headers)` or API key; no route `beforeLoad` |

---

## 7. API keys (automation)

Some endpoints accept **session OR** shared API key.

- Compare with `crypto.timingSafeEqual` (equal-length buffers)
- Valid key → allow; else session/role rules

---

## 8. Checklist

- [ ] New admin page under `/admin` → parent layout `beforeLoad` if present
- [ ] New protected nested route → inherit parent `beforeLoad` / context
- [ ] New session API route → `requireAuth` / `requireAdmin` in handler
- [ ] New script API route → timing-safe API key, then session fallback
- [ ] New server function needing user → `getRequestHeaders()` → session helpers

---

## 9. Gaps to watch

1. Pass **current** request headers into every session call
2. Admin/role checks with cookie cache → `disableCookieCache: true`
3. Redirect cookie names stay in sync with auth config
4. E2E: stubbed session cookies — see `playwright-skill` / tilda-geo `app/tests/`
