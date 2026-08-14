/** pg_dump custom archive with zstd. pg_restore reads this; not plain SQL. */
export const pgDumpArchiveFlags = [
  '--format=custom',
  '--compress=zstd',
  '--no-owner',
  '--no-privileges',
] as const
