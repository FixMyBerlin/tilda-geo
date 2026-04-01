import type { z } from 'zod'
import { serverEnvSchema } from '@/server/envSchema'

export function getValidatedEnv<T>(schema: z.ZodType<T>): T {
  return schema.parse(process.env) as T
}

export const staticDatasetsApiSchema = serverEnvSchema.pick({
  API_ROOT_URL: true,
  ATLAS_API_KEY: true,
})

export type StaticDatasetsApiEnv = z.infer<typeof staticDatasetsApiSchema>

export const staticDatasetsS3Schema = serverEnvSchema.pick({
  S3_KEY: true,
  S3_SECRET: true,
  S3_REGION: true,
  S3_BUCKET: true,
  S3_UPLOAD_FOLDER: true,
})

export const staticDatasetsEnvSchema = serverEnvSchema.pick({
  API_ROOT_URL: true,
  ATLAS_API_KEY: true,
  S3_UPLOAD_FOLDER: true,
})

export const maprouletteSchema = serverEnvSchema.pick({
  MAPROULETTE_API_KEY: true,
})

export const mapboxTilesetsSchema = serverEnvSchema.pick({
  ATLAS_API_KEY: true,
})
