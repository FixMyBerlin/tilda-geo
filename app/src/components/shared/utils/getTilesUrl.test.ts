import { afterEach, describe, expect, it, vi } from 'vitest'

const load = async (env: string, origin: string) => {
  vi.resetModules()
  vi.stubEnv('VITE_APP_ENV', env)
  vi.stubEnv('VITE_APP_ORIGIN', origin)
  const { getTilesUrl, tilesHostSchema } = await import('./getTilesUrl')
  const { getCachelessTilesUrl } = await import('./getCachelessTilesUrl')
  return { getTilesUrl, tilesHostSchema, getCachelessTilesUrl }
}

describe('getTilesUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses the tiles and cacheless hosts of this deployment instance', async () => {
    const { getTilesUrl, getCachelessTilesUrl } = await load(
      'production',
      'https://flaechenfinder.tilda-geo.de',
    )
    const url = getTilesUrl('/roads/{z}/{x}/{y}')
    expect(url).toBe('https://flaechenfinder-tiles.tilda-geo.de/roads/{z}/{x}/{y}')
    expect(getCachelessTilesUrl({ url, cacheless: true })).toBe(
      'https://flaechenfinder-cacheless.tilda-geo.de/roads/{z}/{x}/{y}',
    )
  })

  it('keeps tilda staging on its own hosts', async () => {
    const { getTilesUrl } = await load('staging', 'https://staging.tilda-geo.de')
    expect(getTilesUrl()).toBe('https://staging-tiles.tilda-geo.de')
  })

  it('accepts every registry tiles host as TILES_URL', async () => {
    const { tilesHostSchema } = await load('development', 'http://127.0.0.1:5173')
    expect(tilesHostSchema.options).toEqual([
      'localhost',
      'staging-tiles.tilda-geo.de',
      'tiles.tilda-geo.de',
      'flaechenfinder-tiles.tilda-geo.de',
    ])
  })
})
