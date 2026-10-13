import { describe, expect, test } from 'vitest'
import { LAYER_POSITIONS } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/beforeId'
import { UpdateMapLayerOrderSchema } from './schemas'

const validBeforeId = LAYER_POSITIONS[0]
const entry = (layerKey: string, beforeId: (typeof LAYER_POSITIONS)[number] | null = null) => ({
  layerKey,
  beforeId,
})

describe('UpdateMapLayerOrderSchema', () => {
  test('accepts a full-list replace with null and known positions', () => {
    const parsed = UpdateMapLayerOrderSchema.parse({
      entries: [
        entry('source:atlas_bikelanes--subcat:bikelanes--style:default--layer:line_base'),
        entry('other', validBeforeId),
      ],
    })
    expect(parsed.entries).toHaveLength(2)
    expect(parsed.entries[1]?.beforeId).toBe(validBeforeId)
  })

  test('rejects an empty list', () => {
    const result = UpdateMapLayerOrderSchema.safeParse({ entries: [] })
    expect(result.success).toBe(false)
  })

  test('rejects duplicate layerKey values', () => {
    const result = UpdateMapLayerOrderSchema.safeParse({
      entries: [entry('same'), entry('same')],
    })
    expect(result.success).toBe(false)
  })

  test('rejects an unknown beforeId so MapLibre cannot silently drop the layer', () => {
    const result = UpdateMapLayerOrderSchema.safeParse({
      entries: [{ layerKey: 'a', beforeId: 'atlas-app-beforeid-renamed' }],
    })
    expect(result.success).toBe(false)
  })

  test('rejects a blank layerKey', () => {
    const result = UpdateMapLayerOrderSchema.safeParse({
      entries: [entry('')],
    })
    expect(result.success).toBe(false)
  })
})
