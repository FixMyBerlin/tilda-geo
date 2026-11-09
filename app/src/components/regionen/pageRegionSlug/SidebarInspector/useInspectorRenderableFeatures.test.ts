import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { describe, expect, test } from 'vitest'
import { osmNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersOsmNotes'
import { inspectorRenderableFeatures } from './useInspectorRenderableFeatures'

const feature = (source: string, id: number) => ({ id, source }) as MapGeoJSONFeature
const tildaFeature = (source: string, tildaId: string, properties = {}) =>
  ({ source, properties: { id: tildaId, ...properties } }) as unknown as MapGeoJSONFeature

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

  test('shows a feature of the same data source once across categories', () => {
    const id = 'way/1491598305/cycleway/left'
    const features = inspectorRenderableFeatures(
      [
        tildaFeature('cat:bikelanes--source:atlas_bikelanes--subcat:bikelanes', id),
        tildaFeature('cat:radinfra_bikelanes--source:atlas_bikelanes--subcat:bikelanes', id),
        tildaFeature('cat:bikelanes--source:atlas_bikelanes--subcat:bikelanes', 'way/1/self'),
      ],
      [],
    )
    expect(features.map((item) => [item.source, item.properties.id])).toEqual([
      ['cat:bikelanes--source:atlas_bikelanes--subcat:bikelanes', id],
      ['cat:bikelanes--source:atlas_bikelanes--subcat:bikelanes', 'way/1/self'],
    ])
  })

  test('keeps the same TILDA id from different data sources', () => {
    const id = 'way/1491598305'
    const features = inspectorRenderableFeatures(
      [
        tildaFeature('cat:bikelanes--source:atlas_bikelanes--subcat:bikelanes', id),
        tildaFeature('cat:roads--source:atlas_roads--subcat:roads', id),
      ],
      [],
    )
    expect(features).toHaveLength(2)
  })

  test('keeps features without any id', () => {
    const noId = (name: string) =>
      ({ source: 'static_dataset', properties: { name } }) as unknown as MapGeoJSONFeature
    const features = inspectorRenderableFeatures([noId('a'), noId('b')], [])
    expect(features).toHaveLength(2)
  })
})
