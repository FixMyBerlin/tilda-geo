# Encrypt stored OSM OAuth tokens (one-off)

Better Auth stores each user's OSM OAuth tokens in `prisma."Account"`. Before `account.encryptOAuthTokens` was switched on (`app/src/server/auth/authAccountOptions.server.ts`), they were stored in plain text. With DB access, anyone could post OSM notes in the user's name and read their OSM preferences. The tokens never expire.

The app now writes new tokens encrypted and still reads old plain ones. This script encrypts the existing plain rows (`providerId = 'osm'`) and drops the stored `idToken`. That OpenID token came with the `openid` scope, which TILDA no longer asks for. The app never read it, and Better Auth does not encrypt it.

- Uses Better Auth's own `symmetricEncrypt` with `SESSION_SECRET_KEY`, so the format matches what the app writes.
- Idempotent: a row that is already encrypted is skipped. Run it as often as you like.
- Stops without writing if a token looks encrypted but does not decrypt with this `SESSION_SECRET_KEY` (usually the wrong secret).
- A row that a sign-in changed while the script ran is skipped. That sign-in wrote an encrypted token already.
- Writes without the audit extension (AuditLog masks tokens anyway).

## Order

1. Deploy the app version with `encryptOAuthTokens`. **Never run the script against a database whose app runs the old version**: that app would send the encrypted value to OSM and every OSM note and profile sync would fail until the user signs in again.
2. Run the script with `--dry-run`, check the counts.
3. Run it without `--dry-run`.
4. Run `--dry-run` again: `plain: 0`, `idToken to drop: 0`.
5. Delete the `db-pull` dumps pulled before the run (`app/scripts/db-pull/data/*.sql` on every laptop that ran `bun run db-pull`). They hold the plain tokens. Pull again if a local copy is needed.

## Staging and production

Run it inside the `app` container on the server. It already has the code, the database env and the right `SESSION_SECRET_KEY`, so the secret never leaves the server.

```sh
docker exec app bun scripts/encrypt-osm-oauth-tokens/index.ts --dry-run
docker exec app bun scripts/encrypt-osm-oauth-tokens/index.ts
```

Staging first, then production.

## Local

```sh
bun --env-file=../.env --env-file=../.env.local scripts/encrypt-osm-oauth-tokens/index.ts --dry-run
```

A local database from `bun run db-pull` holds no tokens (the restore clears them), so there is usually nothing to do.

## Why not revoke the tokens instead

Revoking all tokens at OSM and deleting them would also invalidate copies in old backups and `db-pull` dumps. But signed-in users keep their TILDA session, so OSM notes and profile sync would fail for them without a hint until they sign out and in again. Encrypting changes nothing for users. If a leak of a database copy is suspected, revoke the tokens as well.

## Removing the script

Delete this folder once staging and production report `plain: 0`.
