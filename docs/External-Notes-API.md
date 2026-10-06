# External notes API

HTTP API for TILDA's internal notes, made for the iD editor fork (cross-origin, from the browser). It offers what a mapper does on the map: list the notes of one folder, read a note with its comments, write a note, comment, resolve / reopen. Edit, delete and folders stay in TILDA.

Code: `app/src/routes/api/auth.osm-token.ts`, `app/src/routes/api/notes.$regionSlug.$folderId*.ts`, `app/src/server/api/notes/externalNotes.server.ts`, `app/src/server/api/auth/osmToken.server.ts`. Access rules: [Permissions.md](Permissions.md).

## Auth

The client proves the user's OSM identity once and gets a TILDA token.

1. `POST /api/auth/osm-token` with the user's **OSM OAuth2 access token** (the one iD already has; it needs the `read_prefs` scope).
2. TILDA asks OSM whose token it is (`/api/0.6/user/details.json`), finds the TILDA user with that OSM id and returns a **TILDA token** (valid 1 hour, scope `notes`).
3. All notes requests send `Authorization: Bearer <TILDA token>`.

TILDA never stores or logs the OSM token, and stores only a hash of its own token. All TILDA environments (development, staging, production) verify against production OSM (`api.openstreetmap.org`).

The token only says who the user is. Role and region membership are checked on every request, so removing a membership works at once. When the token expires (`401 token_expired`), call the session endpoint again.

```http
POST /api/auth/osm-token
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

## Errors

Every error is JSON `{ "error": "<code>", "message": "<English text>" }`; `invalid_input` adds `info` with the fields.

| Status | `error`              | Meaning                                                          | What the client does                   |
| ------ | -------------------- | ---------------------------------------------------------------- | -------------------------------------- |
| 401    | `missing_token`      | No `Authorization: Bearer` header                                | Log in                                 |
| 401    | `invalid_osm_token`  | Session: OSM rejected the token                                  | Log in to OSM again                    |
| 403    | `no_tilda_user`      | Session: this OSM account has no TILDA account yet               | "Sign in to TILDA once"                |
| 502    | `osm_unavailable`    | Session: OSM could not be asked                                  | Retry later                            |
| 401    | `invalid_token`      | Unknown TILDA token                                              | Request a new session                  |
| 401    | `token_expired`      | TILDA token expired                                              | Request a new session, repeat the call |
| 403    | `not_member`         | The user is not a member of the region (and not an admin)        | "Ask for access to the region"         |
| 404    | `region_not_found`   | Unknown or deactivated region                                    | Config error                           |
| 404    | `folder_not_found`   | The folder is not linked to this region                          | Config error                           |
| 404    | `note_not_found`     | The note is not in this folder                                   | Reload the list                        |
| 400    | `invalid_input`      | Body, query or path parameter not valid                          | Fix the request                        |
| 403    | `origin_not_allowed` | Browser origin not on the allow-list (sent without CORS headers) | Config error on the TILDA side         |
| 429    | `rate_limited`       | More than 20 failed auth attempts per minute from this IP        | Wait a minute                          |

## Endpoints

Base: `/api/notes/{regionSlug}/{folderId}`. Region slug and folder id are fixed in the client's config. The folder id is the `folderId` of a `NoteFolder` that is linked to the region (`/admin/note-folders`).

### List: `GET /api/notes/{regionSlug}/{folderId}`

Query (both optional):

- `status=open|closed`
- `bbox=minLon,minLat,maxLon,maxLat`

```json
200
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": 42,
      "geometry": { "type": "Point", "coordinates": [13.4, 52.5] },
      "properties": {
        "id": 42,
        "status": "open",
        "folderId": 7,
        "subject": "Radweg fehlt",
        "authorId": "cm9x…",
        "authorName": "Mia Mapper",
        "hasComments": true,
        "commentCount": 2,
        "latestComment": "Ist jetzt gemappt",
        "lastCommentFromUser": false,
        "isAuthor": true
      }
    }
  ]
}
```

`isAuthor` and `lastCommentFromUser` refer to the user of the token. The list has no note body; read the note for it.

### Read: `GET /api/notes/{regionSlug}/{folderId}/{noteId}`

```json
200
{
  "id": 42,
  "folderId": 7,
  "subject": "Radweg fehlt",
  "body": "Bitte prüfen",
  "status": "open",
  "resolvedAt": null,
  "createdAt": "2026-10-01T08:00:00.000Z",
  "updatedAt": "2026-10-01T08:00:00.000Z",
  "longitude": 13.4,
  "latitude": 52.5,
  "author": { "id": "cm9x…", "name": "Mia Mapper" },
  "isAuthor": true,
  "comments": [
    {
      "id": 5,
      "body": "Ist jetzt gemappt",
      "createdAt": "2026-10-01T09:00:00.000Z",
      "updatedAt": "2026-10-01T09:00:00.000Z",
      "author": { "id": "cm7a…", "name": "other_mapper" },
      "isAuthor": false
    }
  ]
}
```

`body` can be `null`. Bodies are Markdown, as in TILDA. Comments are sorted oldest first.

### Create a note: `POST /api/notes/{regionSlug}/{folderId}`

```json
{ "subject": "Radweg fehlt", "body": "Bitte prüfen", "longitude": 13.4, "latitude": 52.5 }
```

`subject` is required, `body` optional. Answer: `201` with the note as in "Read".

### Comment: `POST /api/notes/{regionSlug}/{folderId}/{noteId}/comments`

```json
{ "body": "Ist jetzt gemappt" }
```

Answer: `201` with the whole note (including the new comment) as in "Read".

### Resolve / reopen: `PATCH /api/notes/{regionSlug}/{folderId}/{noteId}`

```json
{ "resolved": true }
```

Answer: `200` with the note as in "Read". Any member may resolve and reopen.

## CORS

Only these routes answer cross-origin requests from a browser, and only for the origins listed in `externalApiOrigins` (`app/src/components/shared/utils/appInstances.const.ts`; exact origins, no wildcards, the same list on every deployment).

- Preflight (`OPTIONS`): `204` with `Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS` and `Access-Control-Allow-Headers: Authorization, Content-Type`.
- No cookies are used: send requests without `credentials`.
- Requests without an `Origin` header (curl, scripts) are not restricted by the allow-list; they still need a valid token.

## Example (browser)

```js
const origin = 'https://staging.tilda-geo.de'
const base = `${origin}/api/notes/berlin/7`

const session = await fetch(`${origin}/api/auth/osm-token`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${osmAccessToken}` },
}).then((response) => response.json())

const headers = { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' }

const notes = await fetch(`${base}?status=open&bbox=13.3,52.4,13.5,52.6`, { headers }).then((r) =>
  r.json(),
)
await fetch(`${base}/42/comments`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ body: 'Danke' }),
})
await fetch(`${base}/42`, { method: 'PATCH', headers, body: JSON.stringify({ resolved: true }) })
```

## Operations

- Table `ExternalApiToken` (hash, user, scope, expiry). Expired rows are deleted whenever a new token is issued. To end all external sessions of a user, delete their rows.
- Writes appear in the audit log with the user and `changeSource: EXTERNAL_API`.
- A new browser client needs its origin added to `externalApiOrigins` and a deploy.
