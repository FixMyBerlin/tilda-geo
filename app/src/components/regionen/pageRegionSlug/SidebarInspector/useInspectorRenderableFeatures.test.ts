import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { describe, expect, test } from 'vitest'
import { osmNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersOsmNotes'
import { inspectorRenderableFeatures } from './useInspectorRenderableFeatures'

const feature = (source: string, id: number) => ({ id, source }) as MapGeoJSONFeature

describe('inspectorRenderableFeatures', () => {
  test('drops mode-owned sources from inspector clicks', () => {
    const features = inspectorRenderableFeatures(
      [feature(osmNotesSourceId, 1), feature('parking', 2)],
      [],
    )
    expect(features.map((item) => item.source)).toEqual(['parking'])
  })

  test('falls back to selected map features when the inspector store is empty', () => {
    const features = inspectorRenderableFeatures([], [undefined, feature('parking', 3)])
    expect(features).toEqual([feature('parking', 3)])
  })
})
