import { afterEach, describe, expect, it, vi } from 'vitest'
import { appHostSchema, getAppBaseUrl } from './getAppBaseUrl'

const stubDeployment = (env: string, origin: string) => {
  vi.stubEnv('VITE_APP_ENV', env)
  vi.stubEnv('VITE_APP_ORIGIN', origin)
}

describe('getAppBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('resolves this deployment to VITE_APP_ORIGIN', () => {
    stubDeployment('production', 'https://flaechenfinder.tilda-geo.de')
    expect(getAppBaseUrl()).toBe('https://flaechenfinder.tilda-geo.de')
    expect(getAppBaseUrl('/api/uploads/x.geojson', 'production')).toBe(
      'https://flaechenfinder.tilda-geo.de/api/uploads/x.geojson',
    )
  })

  it('resolves other environments within this deployment instance', () => {
    stubDeployment('staging', 'https://staging.tilda-geo.de')
    expect(getAppBaseUrl('/api', 'production')).toBe('https://tilda-geo.de/api')

    stubDeployment('production', 'https://flaechenfinder.tilda-geo.de')
    expect(getAppBaseUrl('api', 'staging')).toBe('https://flaechenfinder.tilda-geo.de/api')
  })

  it('treats local dev as the tilda instance unless an instance is passed', () => {
    stubDeployment('development', 'http://127.0.0.1:5175')
    expect(getAppBaseUrl(undefined, 'staging')).toBe('https://staging.tilda-geo.de')
    expect(getAppBaseUrl(undefined, 'staging', 'flaechenfinder')).toBe(
      'https://flaechenfinder.tilda-geo.de',
    )
  })

  it('links local dev to its own DEV_PORT_SLOT origin', () => {
    stubDeployment('development', 'http://127.0.0.1:5175')
    expect(getAppBaseUrl('/api', 'development')).toBe('http://127.0.0.1:5175/api')
  })

  it('links deployed apps to slot 0 for development', () => {
    stubDeployment('staging', 'https://staging.tilda-geo.de')
    expect(getAppBaseUrl('/regionen', 'development')).toBe('http://127.0.0.1:5173/regionen')
  })

  it('accepts every registry host as APP_URL', () => {
    expect(appHostSchema.options).toEqual([
      '127.0.0.1',
      'staging.tilda-geo.de',
      'tilda-geo.de',
      'flaechenfinder.tilda-geo.de',
    ])
  })
})
