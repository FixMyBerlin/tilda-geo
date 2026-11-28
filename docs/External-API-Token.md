# External API token

A browser app on another origin (the iD editor fork, a map app) has no TILDA cookie. It proves the user's OpenStreetMap identity once, gets a short-lived **TILDA token** and sends it as `Authorization: Bearer` to the APIs that accept it:

| Scope     | Used for                                                                   | Docs                                           |
| --------- | -------------------------------------------------------------------------- | ---------------------------------------------- |
| `notes`   | The internal notes of a region folder: list, read, write, comment, resolve | [External-Notes-API.md](External-Notes-API.md) |
| `uploads` | Static dataset files with `public: false` (`/api/uploads/...`)             | [Uploads.md](Uploads.md#auth)                  |

Code: `app/src/routes/api/auth.osm-token.ts` (route), `app/src/server/api/auth/osmToken.server.ts` (exchange), `app/src/server/auth/osmTokenInfo.server.ts` (asks OSM), `app/src/server/auth/externalApiToken.const.ts` (scopes and the list of allowed OSM apps), `app/src/server/auth/externalSession.server.ts` (Bearer, rate limit, session of a request), `app/src/server/auth/externalApiTokens.server.ts` (store). Access rules: [Permissions.md](Permissions.md).

## Exchange

1. `POST /api/auth/osm-token?scope=<scope>` with the user's **OSM OAuth2 access token** (the one the app already has). The query parameter `scope` is required: `notes` or `uploads`. Without it, or with another value, the answer is `400 invalid_input` (with the allowed scopes in `info`).
2. TILDA asks OSM about the token (`GET /oauth2/token/info` on openstreetmap.org): whose token it is (the OSM user id) and **which OSM OAuth2 application it was issued to**. Only applications on the [allow-list](#allowed-osm-apps), and only for the scopes listed there, get a token (`403 app_not_allowed`). The token needs no particular OSM permission for this.
3. TILDA finds the TILDA user with that OSM id and returns a **TILDA token** (valid 1 hour) for that one scope. A token only works for its scope.
4. The app sends `Authorization: Bearer <TILDA token>` to the API of that scope.

Every issued token is logged as one line with the app name, the scope and the TILDA user id (never a token).

TILDA never stores or logs the OSM token, and stores only a hash of its own token. All TILDA environments (development, staging, production) verify against production OSM (`www.openstreetmap.org`). Only an OSM user who already has a TILDA account gets a token; no account is created.

The token only says who the user is. Role and region membership are checked on every request, so removing a membership works at once on the server (a browser may still show a private upload it cached, for at most one hour, see [Uploads.md](Uploads.md#auth)). When the token expires (`401 token_expired`), exchange the OSM token again.

The response of `/oauth2/token/info` was checked on 2026-11-24 with a real token of an OSM app: openstreetmap.org answers `200` with `resource_owner_id`, `scope`, `expires_in`, `application.uid` and `created_at` (Doorkeeper). `osmTokenInfo.server.ts` reads `resource_owner_id` and `application.uid`.

```http
POST /api/auth/osm-token?scope=notes
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

## Allowed OSM apps

Whoever holds a user's OSM token could ask for a TILDA token for that user. That is why the exchange only serves OSM OAuth2 applications that are on a list in the code: `EXTERNAL_API_OSM_APPS` in `app/src/server/auth/externalApiToken.const.ts`. Each entry has a `name`, the `osmClientId` of the OSM application (public, not a secret) and the `scopes` it may ask for.

| Name             | OSM application                                                                                            | Scopes             |
| ---------------- | ---------------------------------------------------------------------------------------------------------- | ------------------ |
| `infravelo-apps` | The FixMyCity apps for infraVelo (Netzanpassungen, Knotenpunkte, Fortschritt, Bewertung) and the iD editor | `notes`, `uploads` |

**What this means:** an app on the list can read everything its scope gives the signed-in user in TILDA. With `uploads` that is every private upload the user may see in TILDA (the files of their regions), not single datasets. With `notes` it is the notes of their regions, and they can write. Therefore only apps of FixMyCity itself go on the list, and only with the scopes they need.

**The redirect URIs are part of the rule.** A user gets an OSM token for an app through the redirect URIs registered on that OSM application (in the OSM settings of the application). Every origin that is registered there can get a token for this app id, and then a TILDA token. So when the list changes, review the redirect URIs of the OSM application, and keep them to origins of FixMyCity. The scopes of an entry apply to all of them. One OSM application per app would allow per-app scopes (an app that only needs `notes` would not get `uploads`); today the apps share one OSM application and one entry.

**How to add an app:** it is a code change and a review, there is no setting. Add an entry to `EXTERNAL_API_OSM_APPS` (`name`, the client id of the OSM OAuth2 application, `scopes`), update the table above, and deploy. To remove an app, delete its entry; its TILDA tokens work until they expire (1 hour), or delete the rows of `ExternalApiToken` (see [Operations](#operations)).

## Errors

Every error of the exchange, the notes API and the uploads route with a Bearer token is JSON `{ "error": "<code>", "message": "<English text>" }`; `invalid_input` adds `info` with the fields. The answers are never cached (`Cache-Control: no-store`), a `401` has `WWW-Authenticate: Bearer`, a `429` has `Retry-After` (seconds).

| Status | `error`             | Meaning                                                                     | What the client does                   |
| ------ | ------------------- | --------------------------------------------------------------------------- | -------------------------------------- |
| 401    | `missing_token`     | No `Authorization: Bearer` header                                           | Log in                                 |
| 401    | `invalid_osm_token` | Exchange: OSM rejected the token (invalid, expired or revoked)              | Log in to OSM again                    |
| 403    | `app_not_allowed`   | Exchange: the OSM application is not on the list, or not for this scope     | Not available to this app              |
| 403    | `no_tilda_user`     | Exchange: this OSM account has no TILDA account yet                         | "Sign in to TILDA once"                |
| 502    | `osm_unavailable`   | Exchange: OSM could not be asked                                            | Retry later                            |
| 401    | `invalid_token`     | Unknown TILDA token, or a token of another scope                            | Request a new session                  |
| 401    | `token_expired`     | TILDA token expired                                                         | Request a new session, repeat the call |
| 403    | `not_member`        | The user is not a member of the region (and not an admin)                   | "Ask for access to the region"         |
| 400    | `invalid_input`     | Body, query or path parameter not valid (also a missing or unknown `scope`) | Fix the request                        |
| 429    | `rate_limited`      | Too many failed auth attempts per minute from this IP (see below)           | Wait `Retry-After` seconds             |

The API-specific errors (`region_not_found`, `folder_not_found`, `note_not_found`) are in [External-Notes-API.md](External-Notes-API.md#errors).

## Rate limit

Failed attempts are counted per IP in memory (best effort, one server process): 20 per minute, then `429 rate_limited` with `Retry-After`. The IP is the last hop of `X-Forwarded-For` (`X-Real-IP` as fallback), which the reverse proxy in front of the app writes (Traefik, see `docker-compose.network.yml`); a client cannot choose it. A request without such a header (no proxy, e.g. in development) is not limited at all, and the server logs a warning once; one shared bucket for everybody would let one client lock out all. An API call with a **valid** token always works; only failed attempts are refused while the IP is limited, so a bad client behind the same NAT does not lock out the others. The admin API does the same: it checks the token first and only refuses failed attempts while the IP is limited.

A failure is a missing, unknown or wrong-scope token on an API call, a rejected OSM token, an OSM application that is not allowed, or OSM not answering (so a flood of garbage tokens cannot keep the server asking OSM; the question to OSM has a timeout of 5 seconds). A request to the exchange **without** an `Authorization` header is not a failure: it costs no question to OSM, and any web page of another origin can send such a request for the visitor's IP.

Two buckets, so the one does not lock out the other: the exchange (`POST /api/auth/osm-token`) and the API calls with a TILDA token. The admin API has its own. The limit only slows down clients that keep sending bad tokens. A web page of another origin can still lock the exchange for its visitor's IP for a minute with bad tokens; this is accepted, and tokens that were already issued keep working.

An **expired** token is the normal end of a session and is not counted. Expired tokens stay in the table for 24 hours (`EXTERNAL_API_TOKEN_EXPIRED_RETENTION_MS`), so a client that comes back after a break still gets `token_expired` and not `invalid_token`.

## CORS

Browser apps on any origin may call these routes (`Access-Control-Allow-Origin: *`); the token and the member checks behind it are the access check. No cookies are used for this: send requests without `credentials`. The code is in `app/src/server/api/util/cors.ts` (`corsHeaders`, `preflightResponse`).

- Every answer has `Access-Control-Allow-Origin: *` and `Access-Control-Expose-Headers: ETag, Last-Modified, Content-Range, Content-Length, Content-Disposition`, errors too.
- Preflight (`OPTIONS`): `204` with `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers` and `Access-Control-Max-Age`. The values are per API (see the docs of the API); the other answers do not repeat them.

## Operations

- Table `ExternalApiToken` (hash, user, scope, expiry, last use). Tokens that expired more than 24 hours ago are deleted whenever a new token is issued. To end all external sessions of a user, delete their rows.
- Writes through the notes API appear in the audit log with the user and `changeSource: EXTERNAL_API`.
