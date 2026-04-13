import { getAppBaseUrl } from '@/components/shared/utils/getAppBaseUrl'
import type { EnvironmentValues } from '@/server/envSchema'
import type { StaticDatasetsApiConfig } from './api'
import { red } from './utils/log'

export const STATIC_DATASETS_CLI_ENVS = ['dev', 'staging', 'production'] as const
export type StaticDatasetsCliEnv = (typeof STATIC_DATASETS_CLI_ENVS)[number]

export const STATIC_DATASETS_CLI_ENV_TO_APP = {
  dev: 'development',
  staging: 'staging',
  production: 'production',
} as const satisfies Record<StaticDatasetsCliEnv, EnvironmentValues>

/** S3 path segment under `uploads/` for static datasets (`--env` → app environment). */
export const S3_UPLOAD_FOLDER_BY_APP_ENV = {
  development: 'localdev',
  staging: 'staging',
  production: 'production',
} as const satisfies Record<EnvironmentValues, string>

function resolveAtlasApiKeyForStaticDatasets(appEnv: EnvironmentValues) {
  switch (appEnv) {
    case 'development': {
      const k = process.env.ATLAS_API_KEY
      if (!k?.trim()) {
        red('ATLAS_API_KEY is required when --env=dev (local app API).')
        process.exit(1)
      }
      return k
    }
    case 'staging': {
      const k = process.env.ATLAS_API_KEY_STAGING
      if (!k?.trim()) {
        red(
          'ATLAS_API_KEY_STAGING is required when --env=staging. The staging API expects that key.',
        )
        process.exit(1)
      }
      return k
    }
    case 'production': {
      const k = process.env.ATLAS_API_KEY_PRODUCTION
      if (!k?.trim()) {
        red(
          'ATLAS_API_KEY_PRODUCTION is required when --env=production. The production API expects that key.',
        )
        process.exit(1)
      }
      return k
    }
  }
}

export function buildStaticDatasetsApiConfig(appEnv: EnvironmentValues) {
  return {
    apiRootUrl: getAppBaseUrl('/api', appEnv),
    atlasApiKey: resolveAtlasApiKeyForStaticDatasets(appEnv),
  } satisfies StaticDatasetsApiConfig
}
