# External API token

A browser app on another origin (the iD editor fork, a map app) has no TILDA cookie. It proves the user's OpenStreetMap identity once, gets a short-lived **TILDA token** and sends it as `Authorization: Bearer` to the APIs that accept it:

| Scope     | Used for                                                                                       | Docs                                           |
| --------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `notes`   | The internal notes of a region folder: list, read, write, comment, resolve                     | [External-Notes-API.md](External-Notes-API.md) |
| `uploads` | Static dataset files with `public: false` and `externalTokenAccess: true` (`/api/uploads/...`) | [Uploads.md](Uploads.md#auth)                  |

Code: `app/src/routes/api/auth.osm-token.ts` (route), `app/src/server/api/auth/osmToken.server.ts` (exchange), `app/src/server/auth/externalSession.server.ts` (Bearer, rate limit, session of a request), `app/src/server/auth/externalApiTokens.server.ts` (store). Access rules: [Permissions.md](Permissions.md).

## Exchange

1. `POST /api/auth/osm-token` with the user's **OSM OAuth2 access token** (the one the app already has; it needs the `read_prefs` scope). The query parameter `scope` chooses the scope: `notes` (default) or `uploads`.
2. TILDA asks OSM whose token it is (`/api/0.6/user/details.json`), finds the TILDA user with that OSM id and returns a **TILDA token** (valid 1 hour) for that one scope. A token only works for its scope.
3. The app sends `Authorization: Bearer <TILDA token>` to the API of that scope.

TILDA never stores or logs the OSM token, and stores only a hash of its own token. All TILDA environments (development, staging, production) verify against production OSM (`api.openstreetmap.org`). Only an OSM user who already has a TILDA account gets a token; no account is created.

The token only says who the user is. Role and region membership are checked on every request, so removing a membership works at once. When the token expires (`401 token_expired`), exchange the OSM token again.

```http
POST /api/auth/osm-token            (scope notes)
POST /api/auth/osm-token?scope=uploads
Authorization: Bearer <OSM access token>
```

```json
201
{
  "token": "tildageode_ext_6f1c…",
  "tokenType": "Bearer",
  "scope": "notes",
  "expiresAt": "2026-10-01T13:00:00.000Z",
  "user": { "id": "cm9x…", "osmId": 11881, "name": "Mia Mapper" }
}
```

**Whoever holds a user's OSM token (with `read_prefs`) can get TILDA tokens for that user.** That is why `notes` is limited to members, and why a dataset has to opt in to `uploads` tokens (`externalTokenAccess`, see [Uploads.md](Uploads.md#auth)): a third-party app that got an OSM token must not read every private upload of the user.

## Errors

Every error of the exchange, the notes API and the uploads route with a Bearer token is JSON `{ "error": "<code>", "message": "<English text>" }`; `invalid_input` adds `info` with the fields. The answers are never cached (`Cache-Control: no-store`), a `401` has `WWW-Authenticate: Bearer`, a `429` has `Retry-After` (seconds).

| Status | `error`                 | Meaning                                                                     | What the client does                   |
| ------ | ----------------------- | --------------------------------------------------------------------------- | -------------------------------------- |
| 401    | `missing_token`         | No `Authorization: Bearer` header                                           | Log in                                 |
| 401    | `invalid_osm_token`     | Exchange: OSM rejected the token                                            | Log in to OSM again                    |
| 403    | `no_tilda_user`         | Exchange: this OSM account has no TILDA account yet                         | "Sign in to TILDA once"                |
| 502    | `osm_unavailable`       | Exchange: OSM could not be asked                                            | Retry later                            |
| 401    | `invalid_token`         | Unknown TILDA token, or a token of another scope                            | Request a new session                  |
| 401    | `token_expired`         | TILDA token expired                                                         | Request a new session, repeat the call |
| 403    | `not_member`            | The user is not a member of the region (and not an admin)                   | "Ask for access to the region"         |
| 403    | `token_access_disabled` | Uploads: the file does not accept tokens (`externalTokenAccess` is not set) | Not available to apps; use TILDA       |
| 400    | `invalid_input`         | Body, query or path parameter not valid (also an unknown `scope`)           | Fix the request                        |
| 429    | `rate_limited`          | More than 20 failed auth attempts per minute from this IP (see below)       | Wait `Retry-After` seconds             |

The API-specific errors (`region_not_found`, `folder_not_found`, `note_not_found`) are in [External-Notes-API.md](External-Notes-API.md#errors).

## Rate limit

Failed attempts are counted per IP in memory (best effort, one server process): 20 per minute, then `429 rate_limited` with `Retry-After`. A failure is a missing, unknown or wrong-scope token, a missing or rejected OSM token. Two buckets, so the one does not lock out the other: the exchange (`POST /api/auth/osm-token`) and the API calls with a TILDA token (notes and uploads together). The admin API has its own.

An **expired** token is the normal end of a session and is not counted. Expired tokens stay in the table for 24 hours (`EXTERNAL_API_TOKEN_EXPIRED_RETENTION_MS`), so a client that comes back after a break still gets `token_expired` and not `invalid_token`.

## CORS

Browser apps on any origin may call these routes (`Access-Control-Allow-Origin: *`); the token and the member checks behind it are the access check. No cookies are used for this: send requests without `credentials`. The code is in `app/src/server/api/util/cors.ts` (`corsHeaders`, `preflightResponse`).

- Every answer has `Access-Control-Allow-Origin: *` and `Access-Control-Expose-Headers: ETag, Last-Modified, Content-Range, Content-Length, Content-Disposition`, errors too.
- Preflight (`OPTIONS`): `204` with `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers` and `Access-Control-Max-Age`. The values are per API (see the docs of the API); the other answers do not repeat them.

## Operations

- Table `ExternalApiToken` (hash, user, scope, expiry, last use). Tokens that expired more than 24 hours ago are deleted whenever a new token is issued. To end all external sessions of a user, delete their rows.
- Writes through the notes API appear in the audit log with the user and `changeSource: EXTERNAL_API`.
