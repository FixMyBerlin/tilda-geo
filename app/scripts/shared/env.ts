import type { z } from 'zod'
import { envFullSchema } from '@/server/envSchema'

export function getValidatedEnv<T>(schema: z.ZodType<T>): T {
  return schema.parse(process.env) as T
}

/** S3 credentials for StaticDatasets uploads (upload folder comes from `--env`, not env vars). */
export const staticDatasetsS3CredentialsSchema = envFullSchema.pick({
  S3_KEY: true,
  S3_SECRET: true,
  S3_REGION: true,
  S3_BUCKET: true,
})

export const maprouletteSchema = envFullSchema.pick({
  MAPROULETTE_API_KEY: true,
})

export const mapboxTilesetsSchema = envFullSchema.pick({
  ATLAS_API_KEY: true,
})
