/** Custom archive (not SQL). gzip — Homebrew `libpq` `pg_restore` is not built with zstd; Debian `postgresql-client` in the app image is. */
export const pgDumpArchiveFlags = [
  '--format=custom',
  '--compress=gzip',
  '--no-owner',
  '--no-privileges',
] as const
