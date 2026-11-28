# External notes API

HTTP API for TILDA's internal notes, made for the iD editor fork (cross-origin, from the browser). It offers what a mapper does on the map: list the notes of one folder, read a note with its comments, write a note, comment, resolve / reopen. Edit, delete and folders stay in TILDA.

Code: `app/src/routes/api/notes.$regionSlug.$folderId*.ts`, `app/src/server/api/notes/externalNotes.server.ts`. The token exchange, the shared errors, the rate limit and CORS are in [External-API-Token.md](External-API-Token.md). Access rules: [Permissions.md](Permissions.md).

## Auth

The client exchanges the user's OSM access token for a TILDA token of scope `notes` (`POST /api/auth/osm-token?scope=notes`, valid 1 hour; only OSM applications on the [allow-list](External-API-Token.md#allowed-osm-apps) get one) and sends it as `Authorization: Bearer <TILDA token>` with every notes request. Exchange, token rules and example: [External-API-Token.md](External-API-Token.md#exchange). A token of another scope (`uploads`) is refused with `401 invalid_token`.

The token only says who the user is. Role and region membership are checked on every request. When the token expires (`401 token_expired`), exchange the OSM token again.

## Errors

All errors are JSON `{ "error": "<code>", "message": "<English text>" }`. The codes of the token, the member check and the rate limit (`missing_token`, `invalid_token`, `token_expired`, `not_member`, `invalid_input`, `rate_limited`, …) are in [External-API-Token.md](External-API-Token.md#errors). Notes add:

| Status | `error`            | Meaning                                 | What the client does |
| ------ | ------------------ | --------------------------------------- | -------------------- |
| 404    | `region_not_found` | Unknown or deactivated region           | Config error         |
| 404    | `folder_not_found` | The folder is not linked to this region | Config error         |
| 404    | `note_not_found`   | The note is not in this folder          | Reload the list      |

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

Any origin may call these routes, no cookies are used, see [External-API-Token.md](External-API-Token.md#cors). The preflight (`OPTIONS`) answers `204` with `Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS` and `Access-Control-Allow-Headers: Authorization, Content-Type`.

## Example (browser)

```js
const origin = 'https://staging.tilda-geo.de'
const base = `${origin}/api/notes/berlin/7`

const session = await fetch(`${origin}/api/auth/osm-token?scope=notes`, {
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

Writes appear in the audit log with the user and `changeSource: EXTERNAL_API`. Token storage and cleanup: [External-API-Token.md](External-API-Token.md#operations).
