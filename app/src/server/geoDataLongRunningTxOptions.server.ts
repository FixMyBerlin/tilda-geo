/** Prisma interactive / sequential raw transactions default to 5s; geo batch work needs more. */
export const geoDataLongRunningTxOptions = {
  maxWait: 30_000,
  timeout: 300_000,
} as const
