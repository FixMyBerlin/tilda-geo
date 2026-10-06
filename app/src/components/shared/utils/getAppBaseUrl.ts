import type { EnvironmentValues } from '@/server/envSchema'
import {
  type AppInstance,
  appInstances,
  currentAppInstance,
  deployedHostSchema,
} from './appInstances.const'

/**
 * Link target for "Open DEV" from a deployed app. The deploy cannot know which `DEV_PORT_SLOT`
 * (5173, 5174, …) the viewer's local checkout runs on, so it assumes slot 0.
 * Local dev never uses this; it links to its own `VITE_APP_ORIGIN`.
 */
const slotZeroDevOrigin = 'http://127.0.0.1:5173'

export const appHostSchema = deployedHostSchema('app', new URL(slotZeroDevOrigin).hostname)

/**
 * App URL in `env` (default: this deployment's environment) of `instance` (default: this deployment's instance).
 * This deployment itself always resolves to `VITE_APP_ORIGIN`.
 */
export const getAppBaseUrl = (
  path?: string,
  env: EnvironmentValues = import.meta.env.VITE_APP_ENV,
  instance: AppInstance = currentAppInstance(),
) => {
  const base =
    env === import.meta.env.VITE_APP_ENV && instance === currentAppInstance()
      ? import.meta.env.VITE_APP_ORIGIN
      : env === 'development'
        ? slotZeroDevOrigin
        : appInstances[instance][env].app

  return path ? `${base}/${path.replace(/^\//, '')}` : base
}
