import { describe, expect, it } from 'vitest'
import { regionMaskUploadSlug } from '@/server/regions/masks/generateRegionMask.server'
import { regionMaskLayers } from '@/server/regions/masks/regionMaskLayers.const'
import { parseMapDatasetUploadConfigs } from '@/server/uploads/mapDatasetUploadConfigs.schema'

describe('region mask MapDatasetUpload configs', () => {
  it('uses minimal map-facing shape (name, disabled inspector, layers)', () => {
    const configs = parseMapDatasetUploadConfigs([
      {
        name: 'Maskierung',
        inspector: { enabled: false },
        layers: regionMaskLayers,
      },
    ])
    expect(configs).toHaveLength(1)
    expect(configs[0]).toMatchObject({
      name: 'Maskierung',
      inspector: { enabled: false },
      layers: regionMaskLayers,
    })
    expect(configs[0]).not.toHaveProperty('attributionHtml')
  })
})

describe('regionMaskUploadSlug', () => {
  it('prefixes region slug with region-', () => {
    expect(regionMaskUploadSlug('berlin')).toBe('region-berlin')
    expect(regionMaskUploadSlug('dev-template-parkraum-city')).toBe(
      'region-dev-template-parkraum-city',
    )
  })
})

describe('generateRegionMask integration', () => {
  it('rejects when mask is disabled (no relation ids)', async () => {
    const { generateRegionMask } = await import('@/server/regions/masks/generateRegionMask.server')
    await expect(
      generateRegionMask({
        regionSlug: 'test',
        maskOsmRelationIds: [],
        maskBufferKm: 10,
      }),
    ).rejects.toThrow('Maske ist deaktiviert')
  })
})
