# Permissions

Who can see and do what in TILDA Geo. This is the central reference for humans and agents. When you change an access check, update the matching row here and the test named in it.

Two things are easy to mix up:

- **Access** (this document) is enforced on the server: server functions, API routes, and route loaders.
- **Display** (navigation buttons, lock icons, disabled menu items) only mirrors access. Hiding a button is never the protection, because every server function can be called directly.

## Roles

| Role   | How you get it                                                   | Scope                                                                     |
| ------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Guest  | Not signed in                                                    | Public pages, PUBLIC regions                                              |
| User   | Signed in with OpenStreetMap                                     | Same as guest, plus own profile and OSM notes under their own OSM account |
| Member | A `Membership` row for that region (set in `/admin/memberships`) | Member-only features of that region                                       |
| Admin  | `User.role = ADMIN` in the database                              | Everything. Counts as a member of every region                            |

Sign-in is OpenStreetMap OAuth only; email/password is disabled (`app/src/server/auth/auth.server.ts`). Membership is the only per-region permission. There are no per-feature or per-category roles.

Core helpers in `app/src/server/authorization/`:

| Helper                                                                | Answers                                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `checkRegionAuthorization`                                            | May this session open the region at all? (region status, see below)                   |
| `getRegionHasPermissions`                                             | Is this session a member or admin of the region?                                      |
| `canAccessMemberModeForRegion`                                        | Both: region is open to them **and** they are member/admin. Use for member-only reads |
| `authorizeRegionMemberByRegionSlug` / `authorizeRegionMemberByNoteId` | Throws unless member/admin. Use for member writes                                     |

**Rule of thumb:** region status decides whether the region opens. It never grants access to member-only data. A member-only read on a PUBLIC region must use `canAccessMemberModeForRegion`, not `checkRegionAuthorization`.

## Region status

| Status        | Who can open the region                                |
| ------------- | ------------------------------------------------------ |
| `PUBLIC`      | Everyone who knows the URL                             |
| `PRIVATE`     | Members and admins                                     |
| `DEACTIVATED` | Admins only. Others see "Diese Region ist deaktiviert" |

`promoted` is separate from status and does not change access. The public `/regionen` overview lists only promoted PUBLIC regions.

When a region is denied, the page data is redacted before it reaches the client (`redactRegionForDeniedAccess.server.ts`): map, mask, bbox, categories, background sources, exports, contract, welcome, and logo are removed. Only slug, name, status, and product stay for the denied screen.

Tests: `redactRegionForDeniedAccess.server.test.ts`, `app/tests/pages/region-welcome.spec.ts`, `app/tests/pages/docs-region-downloads.spec.ts`. `checkRegionAuthorization` itself has no unit test.

## Public pages

| Page                                          | Access                          | Notes                                                                                                                             |
| --------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/` (marketing), `/kontakt` (incl. Impressum) | Public                          | Indexed                                                                                                                           |
| `/datenschutz`                                | Public                          | `noindex`                                                                                                                         |
| `/docs/$tableName`                            | Public                          | `noindex`. Optional `?r=<region>` adds region context only when the region is open to the viewer; downloads there need membership |
| `/access-denied`, `/oAuthError`               | Public                          | `noindex`                                                                                                                         |
| `/settings/user`                              | Signed-in users (404 otherwise) | `noindex`. Edits only the user's own profile                                                                                      |

Non-production builds are `noindex` globally (`app/src/routes/__root.tsx`).

Tests: `app/tests/smoke/public-routes.spec.ts` (renders only, does not check `noindex`).

## Admin area

- `/admin/*` requires `role = ADMIN` (`app/src/routes/admin.tsx` → `getIsAdminFn`). Signed-in non-admins go to `/access-denied`, guests to sign-in.
- Every server function used by the admin UI calls `requireAdmin`, either in the `*.functions.ts` handler or in the `queries/` / `mutations/` file it calls.
- Configuration is admin-only: regions, memberships, QA configs, map dataset uploads and categories, region contracts, data schema, API tokens, and the region links of Prüflisten.

Tests: `app/tests/pages/admin.stubbed-auth.spec.ts` (non-admin and guest are turned away). Individual `requireAdmin` call sites have no unit tests.

## HTTP API (`app/src/routes/api`)

| Location            | Guard                                                                                                                                                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/admin/*`       | `guardAdminApi`: Bearer `AdminApiToken` (minted by an admin). A few routes use the admin session instead                                                                                                                                                                                 |
| `/mcp`              | `guardAdminApi` (Bearer `AdminApiToken`)                                                                                                                                                                                                                                                 |
| `api/private/*`     | `ATLAS_API_KEY` (system hooks)                                                                                                                                                                                                                                                           |
| `api/*` (top level) | Mixed, per route: none for public data (boundaries, map style, stats, campaigns, OSM notes RSS), member/admin for region data (`uploads.$slug`, `notes.$regionSlug.download`, `regions.$regionSlug.uploads-csv`, `export.*`), `ATLAS_API_KEY` for `regions`, `uploads`, `uploads.create` |

Two kinds of keys:

- **`AdminApiToken`**: per admin, revocable, admin-equivalent for `api/admin/*` and `/mcp`.
- **`ATLAS_API_KEY`**: one shared secret passed as `?apiKey=`. On `export.*` and `notes.$regionSlug.download` it replaces the member/admin check (including for DEACTIVATED regions). Treat it as admin-equivalent for those routes.

`checkApiKey` accepts every request when `NODE_ENV=development`. Never set that on a reachable deployment.

Tests: none at request level for `api/**` auth, the `ATLAS_API_KEY` bypass, or `/mcp`. Export membership is covered by `app/tests/pages/docs-region-downloads.spec.ts`.

## Region data

| Data                      | Read                                                                                                                                                  | Change                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Categories (map layers)   | Follows region access. No per-category access                                                                                                         | Admin (region config) |
| Calculator ("Summieren")  | Shown whenever its category is active. No extra check                                                                                                 | n/a                   |
| Static datasets / uploads | `public` flag per upload. Non-public files need member/admin, checked on the file route (`api/uploads.$slug.ts`). Non-public entries show a lock icon | Admin                 |
| Exports                   | Region config decides **which** tables. Downloading **always** needs member/admin (or `ATLAS_API_KEY`), also on PUBLIC regions                        | Admin (region config) |

Tests: `docs-region-downloads.spec.ts` (export: guest denied on PUBLIC, admin allowed), `regionModalAccess.test.ts` (which tables are offered). No test for the non-public upload file route.

## Region modes

The mode routes (`app/src/routes/regionen/$regionSlug/*.tsx`) first require region access (parent layout), then redirect non-members of member-only modes to `/access-denied`. Navigation buttons follow `deriveAvailableModes` and `isMemberOnlyMode` in `availableModes.ts`. The server functions below enforce the same rules on their own.

| Mode                        | Opens for                                                                      | Shown in navigation when                                                           |
| --------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Map (default)               | Everyone with region access                                                    | Always                                                                             |
| Hinweise (`/hinweise`)      | Region access. Member-only when the region has internal notes and no OSM notes | Region has OSM or internal notes enabled. Otherwise the route redirects to the map |
| Qualitätssicherung (`/qa`)  | Members and admins                                                             | Member/admin and at least one QA config                                            |
| Prüflisten (`/prueflisten`) | Members and admins                                                             | Member/admin (also before the first list exists)                                   |

Tests: `availableModes.test.ts`, `app/tests/smoke/region-modes.spec.ts` (guests denied), `app/tests/pages/modes-access.stubbed-auth.spec.ts` (signed-in non-member denied, plain member allowed), `canAccessMemberModeForRegion.server.test.ts`.

### Hinweise: OSM notes

- **Read:** fetched in the browser from the public OSM API. Visible wherever the Hinweise page opens.
- **Create:** any signed-in user, posted to openstreetmap.org under their own OSM account (`createOsmNote.server.ts`). Not tied to a region or membership, because the note lands in public OSM data anyway.

### Hinweise: internal notes

Internal notes are always member-only, including on PUBLIC regions.

| Action                        | Who                                                         | Code                                                                                   |
| ----------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| List / read                   | Member, admin                                               | `getNotesAndCommentsForRegion`, `getNoteAndComments`, `api/notes.$regionSlug.download` |
| Create note, comment          | Member, admin                                               | `createNote`, `createNoteComment`                                                      |
| Resolve / reopen              | Any member, admin                                           | `updateNoteResolvedAt`                                                                 |
| Edit / delete note or comment | **Author only** (must also be member). Admins get no bypass | `updateNote`, `deleteNote`, `updateNoteComment`, `deleteNoteComment`                   |

Folders do not exist yet. When they do, linking a folder to other regions is planned as admin-only.

Tests: `getNotesAndCommentsForRegion.server.test.ts` (non-member gets nothing). No tests for create/edit/delete or author-only rules.

### Qualitätssicherung

Everything is member/admin-only: navigation, map styles (status colors), area list, evaluations, and comments. Status colors are loaded through an authorized server function, never through public tiles ([QA-Map-Status-Payload.md](./QA-Map-Status-Payload.md)).

| Action                                                  | Who                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Read configs, area list, map status, evaluations, users | Member, admin (`canAccessMemberModeForRegion`; the config must belong to the region)                                          |
| Create evaluation (status + comment)                    | Member, admin (`createQaEvaluation`). Author edits the comment (`updateQaEvaluationBody`); status and delete are not editable |
| Create / edit / delete QA config                        | Admin                                                                                                                         |

Tests: `app/tests/pages/qa-mode.stubbed-auth.spec.ts` (admin happy path), mode tests above. No unit test for the QA read/write checks or QA config admin checks.

### Prüflisten

Everything is member/admin-only. A list can be linked to several regions; the acting region must be one of them.

| Action                                                | Who                                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Read lists, entries, GeoJSON download                 | Member, admin                                                                                                 |
| Create list (linked to the acting region)             | Member, admin                                                                                                 |
| Rename list                                           | Member, admin                                                                                                 |
| Delete list                                           | Member, admin: only empty lists linked to this region only. Admin (`/admin/review-lists`): any list, cascades |
| Change which regions a list is linked to              | Admin only (`updateReviewListForAdmin`)                                                                       |
| Create, edit, delete entries; upload GeoJSON; comment | Member, admin. Author edits own comment (`updateReviewEntryComment`); no delete                               |

Tests: `reviewListMutationsAuth.server.test.ts` (every member mutation rejects non-members before DB access; rename cannot change region links; shared lists cannot be deleted by members), `getReviewEntry.server.test.ts`, `app/tests/pages/review-lists-mode.stubbed-auth.spec.ts`.

## Comments

Comments share the access of the object they belong to. Only the author edits a comment (and must still be a member); admins get no bypass. Edits are written with `runWithAuditContextAsync` (audit log with user, IP, `MEMBER_FORM`), and the UI shows "aktualisiert" with `updatedAt`.

| Feature        | Edit own comment                             | Delete own comment | Admin edits others |
| -------------- | -------------------------------------------- | ------------------ | ------------------ |
| Internal notes | Yes (`updateNoteComment`)                    | Yes                | No                 |
| QA evaluations | Yes, comment only (`updateQaEvaluationBody`) | No                 | No                 |
| Prüfeinträge   | Yes (`updateReviewEntryComment`)             | No                 | No                 |

Tests: `updateQaEvaluationBody.server.test.ts`, `updateReviewEntryComment.server.test.ts`. No test for internal note comments.

## Known gaps and open decisions

- **Author vs. admin:** product memory was "author or admin may edit". The code is author-only everywhere. Decide before adding an admin bypass.
- **Exports:** members-only is not a per-region setting; it is always on.
- **Impressum:** it is part of `/kontakt` and indexed; only `/datenschutz` is `noindex`.
- **Missing tests** for security-relevant checks: `checkRegionAuthorization`, `api/uploads.$slug` (non-public files), `ATLAS_API_KEY` bypasses, `/mcp`, QA config admin mutations, internal note author-only rules.
