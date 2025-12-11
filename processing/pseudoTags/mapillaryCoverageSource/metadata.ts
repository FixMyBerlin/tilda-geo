import { sql } from 'bun'
import { z } from 'zod'

export async function initializeMapillaryCoverageMetadataTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS data.mapillary_coverage_metadata (
      id SERIAL PRIMARY KEY,
      ml_data_from TIMESTAMPTZ NOT NULL,
      osm_data_from TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  return true
}

const mapillaryCoverageMetadataRowSchema = z.object({
  ml_data_from: z.coerce.date(),
  osm_data_from: z.coerce.date(),
})

export async function getLatestMapillaryCoverageMetadata() {
  const result = await sql`
    SELECT ml_data_from, osm_data_from
    FROM data.mapillary_coverage_metadata
    ORDER BY id DESC
    LIMIT 1
  `
  if (!result[0]) return null
  return mapillaryCoverageMetadataRowSchema.parse(result[0])
}

export async function insertMapillaryCoverageMetadata(mlDataFrom: Date, osmDataFrom: Date) {
  const data = {
    ml_data_from: mlDataFrom,
    osm_data_from: osmDataFrom,
    updated_at: new Date(),
  }

  await sql`INSERT INTO data.mapillary_coverage_metadata ${sql(data)}`

  return true
}
