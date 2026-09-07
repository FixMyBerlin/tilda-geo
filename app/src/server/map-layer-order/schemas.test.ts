import { describe, expect, test } from 'vitest'
import { ATLAS_APP_ANCHOR_IDS } from '@/components/regionen/pageRegionSlug/mapData/types'
import { UpdateMapLayerOrderSchema } from './schemas'

const validBeforeId = ATLAS_APP_ANCHOR_IDS[0]
const entry = (
  layerKey: string,
  beforeId: (typeof ATLAS_APP_ANCHOR_IDS)[number] | null = null,
) => ({
  layerKey,
  beforeId,
})

describe('UpdateMapLayerOrderSchema', () => {
  test('accepts a full-list replace with null and known anchors', () => {
    const parsed = UpdateMapLayerOrderSchema.parse({
      entries: [
        entry('source:atlas_bikelanes--subcat:bikelanes--style:default--layer:line_base'),
        entry('other', validBeforeId),
      ],
      baselineCount: 0,
    })
    expect(parsed.entries).toHaveLength(2)
    expect(parsed.entries[1]?.beforeId).toBe(validBeforeId)
  })

  test('rejects an empty list so a drifted save cannot wipe every region', () => {
    const result = UpdateMapLayerOrderSchema.safeParse({ entries: [], baselineCount: 0 })
    expect(result.success).toBe(false)
  })

  test('rejects duplicate layerKey values', () => {
    const result = UpdateMapLayerOrderSchema.safeParse({
      entries: [entry('same'), entry('same')],
      baselineCount: 2,
    })
    expect(result.success).toBe(false)
  })

  test('rejects an unknown beforeId so MapLibre cannot silently drop the layer', () => {
    const result = UpdateMapLayerOrderSchema.safeParse({
      entries: [{ layerKey: 'a', beforeId: 'housenumber' }],
      baselineCount: 0,
    })
    expect(result.success).toBe(false)
  })

  test('rejects a blank layerKey', () => {
    const result = UpdateMapLayerOrderSchema.safeParse({
      entries: [entry('')],
      baselineCount: 0,
    })
    expect(result.success).toBe(false)
  })
})
