# Better Auth configuration

Library reference for `betterAuth()` / `createAuthClient()`. For TanStack Start mounting, cookies, and route protection, see [auth.md](auth.md).

**Latest API:** [better-auth.com/docs](https://better-auth.com/docs) and [llms.txt](https://better-auth.com/llms.txt).

---

## Setup workflow

1. Install: `bun add better-auth` (FMC apps often pin e.g. `1.6.x` — match the app `package.json`)
2. Set env vars (see below)
3. Create server auth module (`auth.server.ts`) with database + config
4. Mount handler in your framework (TanStack Start: [auth.md](auth.md))
5. Run `bunx @better-auth/cli@latest migrate` or `generate` for Prisma/Drizzle
6. Verify: `GET /api/auth/ok` → `{ "status": "ok" }`

---

## Environment variables

**Better Auth defaults:**

- `BETTER_AUTH_SECRET` — min 32 chars (`openssl rand -base64 32`)
- `BETTER_AUTH_URL` — public app origin

Only set `secret` / `baseURL` in config when env vars are absent.

**FMC TanStack apps (e.g. TILDA):** Often use app-specific names instead:

- `SESSION_SECRET_KEY` → `secret`
- `VITE_APP_ORIGIN` → `baseURL`

---

## CLI

CLI looks for `auth.ts` in `./`, `./lib`, `./utils`, or `./src` (`--config` for custom path).

- `bunx @better-auth/cli@latest migrate` — built-in adapter
- `bunx @better-auth/cli@latest generate` — Prisma/Drizzle schema
- `bunx @better-auth/cli mcp --cursor` — docs MCP for editors

Re-run after adding or changing plugins.

---

## Core config options

| Option             | Notes                                         |
| ------------------ | --------------------------------------------- |
| `appName`          | Optional display name                         |
| `baseURL`          | Only if `BETTER_AUTH_URL` not set             |
| `basePath`         | Default `/api/auth`                           |
| `secret`           | Only if `BETTER_AUTH_SECRET` not set          |
| `database`         | Required for most features                    |
| `secondaryStorage` | Redis/KV for sessions & rate limits           |
| `emailAndPassword` | `{ enabled: true }` to activate               |
| `socialProviders`  | `{ google: { clientId, clientSecret }, ... }` |
| `plugins`          | Server plugins array                          |
| `trustedOrigins`   | CSRF whitelist                                |
| `onAPIError`       | e.g. `errorURL` for OAuth failure redirects   |

---

## Database

**Direct:** `pg.Pool`, `mysql2`, `better-sqlite3`, `bun:sqlite`.

**ORM:** `better-auth/adapters/drizzle`, `prisma`, `mongodb`.

**Critical:** Config uses adapter **model** names, not SQL table names (Prisma `User` → `users` table → use `modelName: "user"`).

---

## Session management

**Storage priority:**

1. `secondaryStorage` defined → sessions there by default
2. `session.storeSessionInDatabase: true` → also persist to DB
3. No DB + `cookieCache` → stateless cookie-only mode

**Cookie cache strategies:** `compact` (default), `jwt`, `jwe`.

**Options:** `session.expiresIn`, `session.updateAge`, `session.cookieCache.maxAge`, `session.cookieCache.version`.

**Privileged checks (FMC):** When `cookieCache` is on, use `auth.api.getSession({ headers, query: { disableCookieCache: true } })` for admin/role gates so stale cache cannot grant access.

---

## User & account

**User:** `user.modelName`, `user.fields`, `user.additionalFields`, `user.changeEmail.enabled`, `user.deleteUser.enabled`.

**Account:** `account.accountLinking.enabled`, `trustedProviders`, `allowDifferentEmails`, `requireLocalEmailVerified` (OAuth-only apps often set `false`).

Registration requires `email` and `name` at the framework level; map columns via `user.fields` when your schema differs.

---

## Email flows

- `emailVerification.sendVerificationEmail` — required for verification
- `emailVerification.sendOnSignUp` / `sendOnSignIn`
- `emailAndPassword.sendResetPassword`

OAuth-only apps: do not enable global `requireEmailVerification` on sign-in; use verification only to flip `emailVerified` and drive UI.

---

## Security (`advanced`)

- `useSecureCookies`, `cookiePrefix`
- `crossSubDomainCookies.enabled`
- `ipAddress.ipAddressHeaders` — behind proxies
- `database.generateId` — custom or `"serial"` / `"uuid"` / `false`
- Avoid `disableCSRFCheck` and `disableOriginCheck` unless you fully understand the risk

**Rate limiting:** `rateLimit.enabled`, `window`, `max`, `storage` (`memory` | `database` | `secondary-storage`).

---

## Hooks

**Endpoint:** `hooks.before` / `hooks.after` with `createAuthMiddleware`; `ctx.path`, `ctx.context.session`, `ctx.context.returned`.

**Database:** `databaseHooks.user|session|account.create|update.before/after`.

**Context:** `session`, `secret`, `authCookies`, `password.hash()` / `verify()`, `adapter`, `internalAdapter`, `generateId()`, `tables`, `baseURL`.

---

## Plugins

Prefer subpaths for tree-shaking:

```ts
import { twoFactor } from 'better-auth/plugins/two-factor'
import { genericOAuth } from 'better-auth/plugins/generic-oauth'
```

Some plugins still export from `better-auth/plugins` (e.g. `customSession`) — match your installed version.

**Common:** `twoFactor`, `organization`, `passkey`, `magicLink`, `emailOtp`, `genericOAuth`, `admin`, `apiKey`, `customSession`, …

**Client:** Mirror server plugins in `createAuthClient({ plugins: [...] })` — e.g. `genericOAuthClient`, `customSessionClient`, `inferAdditionalFields<typeof auth>()`.

---

## Client (React)

`createAuthClient` from `better-auth/react` (or `better-auth/client`).

Methods: `signUp.email()`, `signIn.email()`, `signIn.social()`, `signOut()`, `useSession()`, `getSession()`, `revokeSession()`, `revokeSessions()`.

Prefer client SDK for browser sign-in; server `auth.api.*` when you control headers/cookies (see [auth.md](auth.md)).

---

## Type safety

`typeof auth.$Infer.Session`, `typeof auth.$Infer.Session.user`.

`createAuthClient<typeof auth>()` across client/server.

`customSession` callbacks may need assertions for `user.additionalFields` — see Better Auth TypeScript docs.

---

## Common gotchas

1. Model name vs table name in adapter config
2. Re-run CLI after plugin schema changes
3. `secondaryStorage` → sessions not in DB by default
4. Cookie cache does not include custom session fields — re-fetched on read
5. Change-email sends to current address first, then new address
6. `tanstackStartCookies()` must be the **last** plugin (Better Auth warns via `warnIfCookiePluginNotLast`). Bundle-safe on `1.6.x` (dynamic import); older versions leaked — re-verify after upgrades ([auth.md](auth.md))

---

## Resources

- [Docs](https://better-auth.com/docs)
- [TanStack Start integration](https://better-auth.com/docs/integrations/tanstack)
- [Options reference](https://better-auth.com/docs/reference/options)
- [GitHub](https://github.com/better-auth/better-auth)
