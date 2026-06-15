# Endpoint Auth Lint Pattern

Short form of the Trassenscout auth-boundary lint pattern.

## Intent

Every server boundary must make an auth decision first. The first non-empty statement should say one of:

- this boundary requires a session/admin/project role/API key
- this boundary is intentionally public, with a reason
- auth is inherited or delegated elsewhere, with a reason

This makes missing auth visible in review and machine-checkable by Oxlint.

## Trassenscout reference

Trassenscout implements this as local ESLint-compatible rules loaded by **Oxlint custom plugins** (`jsPlugins`) in [`oxlint.config.mjs`](https://github.com/FixMyBerlin/trassenscout/blob/tanstack-start-migration/oxlint.config.mjs):

- [`require-endpoint-auth`](https://github.com/FixMyBerlin/trassenscout/blob/tanstack-start-migration/lint/plugins/require-endpoint-auth.mjs): checks `src/routes/api/**/*.ts`, route `beforeLoad`, and `src/server/**/*.server.ts`
- [`no-auth-boundary-import`](https://github.com/FixMyBerlin/trassenscout/blob/tanstack-start-migration/lint/plugins/no-auth-boundary-import.mjs): blocks direct imports from low-level auth/session helpers outside `src/server/auth/`

The shared AST helper for detecting `endpointAuth.*` and allowed route auth functions is [`lint/utils/endpoint-auth-ast.mjs`](https://github.com/FixMyBerlin/trassenscout/blob/tanstack-start-migration/lint/utils/endpoint-auth-ast.mjs).

The public API is `src/server/auth/endpointAuth.server.ts`. Boundary functions start with calls like:

```ts
await endpointAuth.session(headers)
await endpointAuth.admin(headers)
await endpointAuth.projectRole(headers, projectSlug, roles)
endpointAuth.apiKey(request)
endpointAuth.public('public survey submission with token validation')
endpointAuth.inherited('auth enforced in serveProjectUploadObject')
```

`public(...)` and `inherited(...)` require a non-empty string literal reason.

## Route auth exception

Route auth is still layout `beforeLoad`, not middleware.

Trassenscout route layouts call a closed set of route server functions from `src/server/auth/auth.functions.ts`:

- `routeGuestFn`
- `routeSessionFn`
- `routeAdminFn`
- `routeProjectFn`

The lint helper allowlists exactly those names as valid first statements in `beforeLoad`. They wrap the same session/project checks but throw TanStack `redirect(...)` for page UX. `endpointAuth.session(...)` and `endpointAuth.projectRole(...)` throw `AuthorizationError`, so they are for API/server data boundaries, not route redirects.

## Do not convert this to middleware

Do not present request middleware or global function middleware as the FMC auth-route solution. Use this pattern:

- route UX/auth redirects: layout `beforeLoad` + route server functions
- data/API security: `endpointAuth.*` or domain guards as the first boundary statement
- public RPCs: `public*.functions.ts` and explicit `endpointAuth.public(...)` / token validation where needed
