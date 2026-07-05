import { sql } from 'bun'
import { getBaseDatabaseUrl } from '@/server/database-url.server'

export type GeoMetaProbe = {
  metaExists: boolean
  topicsColumnExists: boolean
}

export async function probeGeoMeta() {
  process.env.DATABASE_URL = getBaseDatabaseUrl()

  const [row] = await sql<GeoMetaProbe[]>`
    SELECT
      to_regclass('public.meta') IS NOT NULL AS "metaExists",
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'meta'
          AND column_name = 'topics'
      ) AS "topicsColumnExists"
  `

  return {
    metaExists: row?.metaExists ?? false,
    topicsColumnExists: row?.topicsColumnExists ?? false,
  }
}

export function geoMetaProbeOk(probe: GeoMetaProbe) {
  return probe.metaExists && probe.topicsColumnExists
}

export function describeGeoMetaProbeIssue(probe: GeoMetaProbe) {
  if (!probe.metaExists) {
    return '`public.meta` is missing. Run `bun run seed` from `app/`.'
  }
  return '`public.meta` exists but is missing the `topics` column (outdated schema). Run `bun run seed`.'
}
