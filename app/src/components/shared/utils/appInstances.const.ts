import { z } from 'zod'
import type { EnvironmentValues } from '@/server/envSchema'

type DeployedEnvironment = Exclude<EnvironmentValues, 'development'>
type DeploymentOrigins = { app: string; tiles: string; cacheless: string }
export type DeploymentOriginKind = keyof DeploymentOrigins

const flaechenfinder = {
  app: 'https://flaechenfinder.tilda-geo.de',
  tiles: 'https://flaechenfinder-tiles.tilda-geo.de',
  cacheless: 'https://flaechenfinder-cacheless.tilda-geo.de',
}

/**
 * Public origins of every deployment of this codebase, per environment.
 * A deploy finds its own row via `VITE_APP_ORIGIN`; instances without a separate staging list the same origins twice.
 */
export const appInstances = {
  tilda: {
    staging: {
      app: 'https://staging.tilda-geo.de',
      tiles: 'https://staging-tiles.tilda-geo.de',
      cacheless: 'https://staging-cacheless.tilda-geo.de',
    },
    production: {
      app: 'https://tilda-geo.de',
      tiles: 'https://tiles.tilda-geo.de',
      cacheless: 'https://cacheless.tilda-geo.de',
    },
  },
  flaechenfinder: { staging: flaechenfinder, production: flaechenfinder },
} as const satisfies Record<string, Record<DeployedEnvironment, DeploymentOrigins>>

/**
 * Browser origins that may call the external notes API (our iD editor fork), on every deployment.
 * Exact origins, no wildcards. See `docs/External-Notes-API.md`.
 */
export const externalApiOrigins = [
  'http://127.0.0.1:8080', // iD dev server
  'https://deploy-preview-10--tordans-id-experiments.netlify.app', // iD fork, Netlify preview
]

export type AppInstance = keyof typeof appInstances

export const appInstanceNames = Object.keys(appInstances) as AppInstance[]

const deployments = appInstanceNames.flatMap((name) => Object.values(appInstances[name]))

/** Every deployed origin of `kind`; `VITE_APP_ORIGIN` of a staging/production deploy must be one of the `app` origins. */
export const deployedOrigins = (kind: DeploymentOriginKind) =>
  [...new Set(deployments.map((deployment) => deployment[kind]))] as [string, ...string[]]

/** Valid Traefik host values (`APP_URL`, `TILES_URL`, `CACHELESS_URL` in `.github/env/deploy.manifest.json`). */
export const deployedHostSchema = (kind: DeploymentOriginKind, devHost: string) =>
  z.enum([
    ...new Set([devHost, ...deployedOrigins(kind).map((origin) => new URL(origin).hostname)]),
  ])

const instanceByAppOrigin = new Map(
  appInstanceNames.flatMap((name) =>
    Object.values(appInstances[name]).map(({ app }) => [app, name] as const),
  ),
)

/** This deployment's instance; local dev is always `tilda`. */
export const currentAppInstance = (): AppInstance =>
  import.meta.env.VITE_APP_ENV === 'development'
    ? 'tilda'
    : // Startup env validation (`envAppStartupValidationSchema`) only lets registry `app` origins through.
      (instanceByAppOrigin.get(import.meta.env.VITE_APP_ORIGIN) as AppInstance)
