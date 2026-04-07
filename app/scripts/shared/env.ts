import type { z } from 'zod'
import { envFullSchema } from '@/server/envSchema'

export function getValidatedEnv<T>(schema: z.ZodType<T>): T {
  return schema.parse(process.env) as T
}

export const staticDatasetsApiSchema = envFullSchema.pick({
  API_ROOT_URL: true,
  ATLAS_API_KEY: true,
})

export type StaticDatasetsApiEnv = z.infer<typeof staticDatasetsApiSchema>

export const staticDatasetsS3Schema = envFullSchema.pick({
  S3_KEY: true,
  S3_SECRET: true,
  S3_REGION: true,
  S3_BUCKET: true,
  S3_UPLOAD_FOLDER: true,
})

export const staticDatasetsEnvSchema = envFullSchema.pick({
  API_ROOT_URL: true,
  ATLAS_API_KEY: true,
  S3_UPLOAD_FOLDER: true,
})

export const maprouletteSchema = envFullSchema.pick({
  MAPROULETTE_API_KEY: true,
})

export const mapboxTilesetsSchema = envFullSchema.pick({
  ATLAS_API_KEY: true,
})
