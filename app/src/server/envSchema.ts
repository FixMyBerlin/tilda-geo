/**
 * Server env schema for one-time validation at startup. Mirrors env.d.ts (ProcessEnv).
 * Do not use z.coerce or other type coercion: env vars are strings at runtime and we use them
 * directly with types from env.d.ts; coercion would give inferred types that don't match runtime.
 */
import { z } from 'zod'
import { getAppBaseUrl } from '@/components/shared/utils/getAppBaseUrl'

const environmentValues = z.enum(['development', 'staging', 'production'])
const mapboxToken = z.string().regex(/^pk\./)
const requiredString = z.string().min(1)

export const envViteSchema = z.object({
  VITE_APP_ENV: environmentValues,
  VITE_APP_ORIGIN: z.string().url(),
  VITE_PLAYWRIGHT_ENABLED: z.string().optional(),
})

export type EnvVite = z.infer<typeof envViteSchema>

const envServerSchema = z.object({
  SESSION_SECRET_KEY: requiredString,
  DATABASE_HOST: requiredString,
  DATABASE_USER: requiredString,
  DATABASE_PASSWORD: requiredString,
  DATABASE_NAME: requiredString,
  OSM_CLIENT_ID: requiredString,
  OSM_CLIENT_SECRET: requiredString,
  S3_KEY: requiredString,
  S3_SECRET: requiredString,
  S3_REGION: z.literal('eu-central-1'),
  ATLAS_API_KEY: requiredString,
  MAPROULETTE_API_KEY: requiredString,
  MAILJET_APIKEY_PUBLIC: z.string().optional(),
  MAILJET_APIKEY_PRIVATE: z.string().optional(),
})

const envAppSchemaPart = envViteSchema.extend(envServerSchema.shape)

const apiRootUrlByEnvironment = {
  development: getAppBaseUrl('/api', 'development'),
  staging: getAppBaseUrl('/api', 'staging'),
  production: getAppBaseUrl('/api', 'production'),
}

const envScriptOnlySchemaPart = z.object({
  MAPBOX_STYLE_ACCESS_TOKEN: mapboxToken,
  MAPBOX_PARKING_STYLE_ACCESS_TOKEN: mapboxToken,
  API_ROOT_URL: z.enum([
    apiRootUrlByEnvironment.development,
    apiRootUrlByEnvironment.staging,
    apiRootUrlByEnvironment.production,
  ]),
  S3_BUCKET: requiredString,
  S3_UPLOAD_FOLDER: z.enum(['production', 'staging', 'localdev']),
  /** Local `.env` only: `bun run static-datasets-update -- --env=staging` requires this (no fallback to ATLAS_API_KEY). */
  ATLAS_API_KEY_STAGING: z.string().optional(),
  /** Local `.env` only: required when `--env=production` for StaticDatasets script. */
  ATLAS_API_KEY_PRODUCTION: z.string().optional(),
})

/** Env keys used by processing pipeline (see processing/utils/parameters.ts). Not validated at app startup, for types/FYI only. */
const envProcessingSchema = z.object({
  WAIT_FOR_FRESH_DATA: z.string().optional(),
  SKIP_DOWNLOAD: z.string().optional(),
  SKIP_WARM_CACHE: z.string().optional(),
  PROCESS_GEOFABRIK_OAUTH_OSM_USERNAME: z.string().optional(),
  PROCESS_GEOFABRIK_OAUTH_OSM_PASSWORD: z.string().optional(),
  PROCESS_GEOFABRIK_DOWNLOAD_URL: z.string().optional(),
  PROCESSING_DIFFING_MODE: z.string().optional(),
  PROCESSING_DIFFING_BBOX: z.string().optional(),
  SKIP_UNCHANGED: z.string().optional(),
  ENVIRONMENT: z.string().optional(),
  PROCESS_ONLY_TOPICS: z.string().optional(),
  PROCESS_ONLY_BBOX: z.string().optional(),
  OSM2PGSQL_LOG_LEVEL: z.string().optional(),
  OSM2PGSQL_NUMBER_PROCESSES: z.string().optional(),
})

/** Validated at app startup (Nitro). Unknown keys are allowed; the plugin logs them as FYI. */
export const envAppStartupValidationSchema = envAppSchemaPart

/** Full server env type (app + script + processing). No .strict() so scripts can run with extra env. */
export const envFullSchema = envViteSchema
  .extend(envServerSchema.shape)
  .extend(envScriptOnlySchemaPart.shape)
  .extend(envProcessingSchema.shape)

export type EnvFullSchema = z.infer<typeof envFullSchema>

export type EnvironmentValues = z.infer<typeof environmentValues>
