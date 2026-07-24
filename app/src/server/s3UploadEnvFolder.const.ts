import type { EnvironmentValues } from '@/server/envSchema'

/** S3 path segment keyed off `VITE_APP_ENV` so dev/staging/prod uploads never collide. */
export const S3_UPLOAD_FOLDER_BY_APP_ENV = {
  development: 'localdev',
  staging: 'staging',
  production: 'production',
} as const satisfies Record<EnvironmentValues, string>

export function s3UploadEnvFolder() {
  return S3_UPLOAD_FOLDER_BY_APP_ENV[process.env.VITE_APP_ENV]
}
