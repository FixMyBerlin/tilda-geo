import type { AppEnv } from '@/server/envSchema'

export const appBaseUrl: Record<AppEnv, string> = {
  development: 'http://127.0.0.1:5173',
  staging: 'https://staging.tilda-geo.de',
  production: 'https://tilda-geo.de',
}
