# Auth in TanStack Start (TILDA Geo)

Short reference for our Better Auth setup and how we protect routes in TanStack Start.

---

## 1. Better Auth setup

- **Server:** [app/src/lib/auth.server.ts](../app/src/lib/auth.server.ts) — `betterAuth()` with Prisma adapter, OSM-only (generic OAuth), custom session with `role`.
- **Client:** [app/src/lib/auth-client.ts](../app/src/lib/auth-client.ts) — `createAuthClient()` with `genericOAuthClient`, `customSessionClient`, `inferAdditionalFields`.
- **Session helpers (server):** [app/src/server/auth/session.server.ts](../app/src/server/auth/session.server.ts) — `getSession`, `getAppSession`, `requireAuth`, `requireAdmin`. All take `headers: Headers` so Better Auth can read cookies; pass `getRequestHeaders()` or `request.headers`. See [§ 3](#3-design-beforeload-no-middleware) and [§ 6](#6-gaps-and-improvements).

**Why not `tanstackStartCookies`:** We don’t use Better Auth’s TanStack Start cookie helper; it pulls `@tanstack/react-start/server` into the client bundle (Vite/transformStream leak). We set cookies manually in the auth API route. See [app/src/lib/auth.server.ts](../app/src/lib/auth.server.ts) and [app/src/routes/api/auth.$.ts](../app/src/routes/api/auth.$.ts).

**Auth API:** All Better Auth routes live under `/api/auth/*`. The handler forwards the request to `auth.handler()` and then copies `Set-Cookie` from the response into the response we send (via [app/src/server/auth/auth-route-handler.server.ts](../app/src/server/auth/auth-route-handler.server.ts)), so the session cookie is set correctly.

**Sign-in entry:** `/api/sign-in/osm` accepts a `callbackURL` search param and POSTs to Better Auth’s OAuth endpoint; after OAuth, users are redirected back. Use `redirect({ to: '/api/sign-in/osm', search: { callbackURL } })` or `router.buildLocation({ to: '/api/sign-in/osm', search: { callbackURL } })` for type-safe URLs.

---

## 2. Approach in TanStack Start — where we put checks

- **Route-level gates:** We use **`beforeLoad`** on route definitions, not a global middleware. That keeps auth logic next to the route tree and avoids pulling server-only code into the client.
- **Server-side only:** Session is read on the server via `auth.api.getSession({ headers })`. We never rely on client-only session for access control; server functions and API handlers receive headers (or use `getRequestHeaders()`) and pass them into [session.server](../app/src/server/auth/session.server.ts).
- **Two patterns:**
  - **Redirect when unauthorized:** `beforeLoad` calls a server function that checks session/role; if not allowed, it throws `redirect({ to: signInUrl })`.
  - **Allow but flag:** `beforeLoad` runs a server function that returns e.g. `isAuthorized`; the loader and component use that to show different UI (e.g. region page: map vs “no access”).

---

## 3. Design: beforeLoad, no middleware

We use **`beforeLoad`** (and loaders) for auth, not a framework-level middleware.

- **Why beforeLoad:** Runs in the same server context as loaders and has access to `params`, `request`, etc. Fits TanStack Router’s route-centric model; each protected route (or layout) declares its own check.
- **Why not middleware:** We’d need a single place that has request and path and runs before routes; that’s possible but we’d duplicate route-tree knowledge. Keeping checks in `beforeLoad` keeps “who is protected” visible in the route files.
- **Important:** Session helpers take `headers: Headers`. In route `beforeLoad` we call **server functions** that use `getRequestHeaders()` and pass them into `getSession` / `getAppSession` / `requireAdmin`. See [app/src/server/admin/admin.functions.ts](../app/src/server/admin/admin.functions.ts) and [app/src/server/regions/regions.functions.ts](../app/src/server/regions/regions.functions.ts). For where server-only code lives and how API routes fit in, see [TanStack-Start-Client-Server-Boundaries.md](TanStack-Start-Client-Server-Boundaries.md).

---

## 4. Which routes are protected (and how)

| Area                        | Protection           | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`/`**                     | Optional redirect    | [app/src/routes/index.tsx](../app/src/routes/index.tsx) — `beforeLoad` reads a redirect cookie (e.g. post–sign-in) and redirects if set. No auth required.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **`/admin`** (and children) | Admin only           | [app/src/routes/admin.tsx](../app/src/routes/admin.tsx) — `beforeLoad` calls `getIsAdminFn()`; if not admin, redirect to sign-in with `redirect({ to: '/api/sign-in/osm', search: { callbackURL: location.href } })`.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **`/regionen/$regionSlug`** | Public status + user | [app/src/routes/regionen/$regionSlug.tsx](../app/src/routes/regionen/$regionSlug.tsx) — `beforeLoad`: (1) URL normalization/redirects via [getRegionRedirectUrl](../app/src/app/regionen/[regionSlug]/getRegionRedirectUrl.ts), (2) `getRegionPageBeforeLoadFn()` → [checkRegionAuthorization](../app/src/server/authorization/checkRegionAuthorization.ts) (region status + session). **PUBLIC** = anyone; **PRIVATE** = only members (or admin); **DEACTIVATED** = no access. Result `isAuthorized` is passed into loader/context; [PageRegionSlug](../app/src/components/regionen/PageRegionSlug.tsx) shows map or “access denied” based on `data.authorized`. |
| **API routes**              | Per-handler          | No `beforeLoad` on API routes. Each handler (e.g. `/api/regions/...`, `/api/export/...`) enforces auth or API key itself (see [§ 5](#5-api-keys-atlas_api_key-and-timing-safe-check)).                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

---

## 5. API keys (ATLAS_API_KEY) and timing-safe check

Some endpoints allow **either** session **or** a shared **API key** (e.g. for scripts or internal callers).

- **Where:** Export and some private/automation endpoints (e.g. [app/src/routes/api/export.$regionSlug.$tableName.ts](../app/src/routes/api/export.$regionSlug.$tableName.ts) — `/api/export-ogr/...` redirects to it with the same params — [app/src/routes/api/notes.$regionSlug.download.ts](../app/src/routes/api/notes.$regionSlug.download.ts), [app/src/routes/api/private/warm-cache.ts](../app/src/routes/api/private/warm-cache.ts)).
- **Check:** [app/src/app/api/\_util/checkApiKey.ts](../app/src/app/api/_util/checkApiKey.ts) — `compareApiKeyTimingSafe(providedKey)` using `crypto.timingSafeEqual` so comparison time doesn’t leak the key. Env: `ATLAS_API_KEY`.
- **Flow:** If `apiKey` matches → allow. Else fall back to session/region rules (e.g. export: valid session + region access). There is no “temporal” check beyond normal request handling; the important part is the **timing-safe** comparison.

---

## 6. Gaps and improvements

1. **Pass headers into session helpers** — **Resolved.** Session helpers take `headers: Headers`. Server Fns pass `getRequestHeaders()` or `getRequest().headers`; API handlers pass `request.headers`. Server modules that need session take `headers: Headers`; their callers supply the current request’s headers.

2. **Server functions vs API handlers**
   Same pattern for both: obtain the current request’s headers and pass them into any module that calls session helpers. See [TanStack-Start-Client-Server-Boundaries.md](TanStack-Start-Client-Server-Boundaries.md).

3. **No API token / machine auth beyond API key**
   We only have session (cookie) and a single shared `ATLAS_API_KEY`. There is no per-client or per-tenant API token or “temporal” token scheme. If you add one, document it here and keep timing-safe comparison for any secret comparison.

4. **Redirect cookie**
   The redirect cookie ([app/src/server/auth/redirectCookie.ts](../app/src/server/auth/redirectCookie.ts), read on `/`, is a small, separate mechanism (e.g. post–sign-in redirect). Keep it in mind when changing auth or cookie names ([app/src/server/auth/cookieName.const.ts](../app/src/server/auth/cookieName.const.ts)).

---

## 7. Quick “what to do” reference

- **New admin-only page under `/admin`:** No extra work; layout [admin.tsx](../app/src/routes/admin.tsx) already enforces admin in `beforeLoad`.
- **New region-level route under `/regionen/$regionSlug`:** It inherits `beforeLoad` and loader from [regionen/$regionSlug.tsx](../app/src/routes/regionen/$regionSlug.tsx); use `context.isAuthorized` / loader data as needed.
- **New API route that needs session:** In the handler, call `getAppSession(request.headers)` (or `requireAuth` / `requireAdmin`).
- **New API route that allows scripts:** Accept an `apiKey` query/body param and use `compareApiKeyTimingSafe(apiKey)` from [checkApiKey.ts](../app/src/app/api/_util/checkApiKey.ts); if valid, skip session check.
- **New server function that needs current user:** Pass `getRequestHeaders()` or `getRequest().headers` to `getAppSession` (or `requireAuth` / `requireAdmin`). If the server function calls a module that needs session, pass `headers: Headers` as an argument to that module.

For more on Better Auth, see [.cursor/skills/better-auth-best-practices/SKILL.md](../.cursor/skills/better-auth-best-practices/SKILL.md) and [better-auth.com/docs](https://better-auth.com/docs).
