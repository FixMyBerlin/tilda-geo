/**
 * Server env schema for one-time validation at startup. Mirrors env.d.ts (ProcessEnv).
 * Do not use z.coerce or other type coercion: env vars are strings at runtime and we use them
 * directly with types from env.d.ts; coercion would give inferred types that don't match runtime.
 */
import { z } from 'zod'

const appEnv = z.enum(['development', 'staging', 'production'])

const mapboxToken = z.string().regex(/^pk\./)

export const viteEnvSchema = z.object({
  VITE_APP_ENV: appEnv,
  VITE_APP_ORIGIN: z.string(),
  VITE_PLAYWRIGHT_ENABLED: z.string().optional(),
})

export type ViteEnv = z.infer<typeof viteEnvSchema>

const appServerEnvSchema = z.object({
  SESSION_SECRET_KEY: z.string(),
  DATABASE_HOST: z.string(),
  DATABASE_USER: z.string(),
  DATABASE_PASSWORD: z.string(),
  DATABASE_NAME: z.string(),
  OSM_CLIENT_ID: z.string(),
  OSM_CLIENT_SECRET: z.string(),
  S3_KEY: z.string(),
  S3_SECRET: z.string(),
  S3_REGION: z.literal('eu-central-1'),
  ATLAS_API_KEY: z.string(),
  MAPROULETTE_API_KEY: z.string(),
  MAILJET_APIKEY_PUBLIC: z.string().optional(),
  MAILJET_APIKEY_PRIVATE: z.string().optional(),
  APP_URL: z.union([z.literal('staging.tilda-geo.de'), z.literal('tilda-geo.de'), z.literal('')]),
  CACHELESS_URL: z.union([
    z.literal('staging-cacheless.tilda-geo.de'),
    z.literal('cacheless.tilda-geo.de'),
    z.literal(''),
  ]),
  TILES_URL: z.union([
    z.literal('staging-tiles.tilda-geo.de'),
    z.literal('tiles.tilda-geo.de'),
    z.literal(''),
  ]),
})

const scriptEnvSchema = z.object({
  MAPBOX_STYLE_ACCESS_TOKEN: mapboxToken,
  MAPBOX_PARKING_STYLE_ACCESS_TOKEN: mapboxToken,
  API_ROOT_URL: z.union([
    z.literal('http://127.0.0.1:5173/api'),
    z.literal('https://staging.tilda-geo.de/api'),
    z.literal('https://tilda-geo.de/api'),
  ]),
  S3_BUCKET: z.string(),
  S3_UPLOAD_FOLDER: z.enum(['production', 'staging', 'localdev']),
})

/** Env keys used by processing pipeline (see processing/utils/parameters.ts). Not validated at app startup, for types/FYI only. */
const processingEnvSchema = z.object({
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
export const appEnvSchema = viteEnvSchema.extend(appServerEnvSchema.shape)

/** Full server env type (app + script + processing). No .strict() so scripts can run with extra env. */
export const serverEnvSchema = viteEnvSchema
  .extend(appServerEnvSchema.shape)
  .extend(scriptEnvSchema.shape)
  .extend(processingEnvSchema.shape)

// export const knownEnvKeys = new Set(Object.keys(serverEnvSchema.shape))

export type ServerEnv = z.infer<typeof serverEnvSchema>

export type AppEnv = z.infer<typeof appEnv>
