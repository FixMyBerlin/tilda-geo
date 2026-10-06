import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { describe, expect, test } from 'vitest'
import type { UrlFeature } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/types'
import { osmNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersOsmNotes'
import { mergeModeUrlFeature, partitionClickedFeatures } from './partitionClickedFeatures'

const streetFeature = {
  id: 10,
  source: 'atlas_bikelanes',
  properties: { id: 10 },
  geometry: { type: 'Point', coordinates: [13.4, 52.5] },
} as unknown as MapGeoJSONFeature

const otherStreetFeature = {
  id: 11,
  source: 'atlas_bikelanes',
  properties: { id: 11 },
  geometry: { type: 'Point', coordinates: [13.41, 52.51] },
} as unknown as MapGeoJSONFeature

const otherNoteFeature = {
  id: 101,
  source: osmNotesSourceId,
  properties: { id: 101 },
  geometry: { type: 'Point', coordinates: [13.51, 52.51] },
} as unknown as MapGeoJSONFeature

const streetUrl = {
  id: 10,
  sourceId: 'atlas_bikelanes',
  coordinates: [13.4, 52.5],
} satisfies UrlFeature

const noteUrl = {
  id: 100,
  sourceId: osmNotesSourceId,
  coordinates: [13.5, 52.5],
} satisfies UrlFeature

const otherNoteUrl = {
  id: 101,
  sourceId: osmNotesSourceId,
  coordinates: [13.51, 52.51],
} satisfies UrlFeature

const partition = (
  clickedFeatures: MapGeoJSONFeature[],
  options?: {
    previousUrlFeatures?: UrlFeature[]
    previousInspectorFeatures?: MapGeoJSONFeature[]
    multiselect?: boolean
    currentMode?: 'map' | 'notes' | 'qa' | 'reviewLists'
  },
) =>
  partitionClickedFeatures({
    clickedFeatures,
    currentMode: options?.currentMode ?? 'notes',
    previousUrlFeatures: options?.previousUrlFeatures ?? [noteUrl, streetUrl],
    previousInspectorFeatures: options?.previousInspectorFeatures ?? [streetFeature],
    regionDatasets: [],
    multiselect: options?.multiselect ?? false,
  })

describe('partitionClickedFeatures', () => {
  test('street click keeps the selected note and replaces the inspector', () => {
    const { nextInspectorFeatures, nextUrlFeatures } = partition([streetFeature])

    expect(nextInspectorFeatures.map((feature) => feature.id)).toEqual([10])
    expect(nextUrlFeatures).toEqual([streetUrl, noteUrl])
  })

  test('empty click clears the inspector and keeps the selected note', () => {
    const { nextInspectorFeatures, nextUrlFeatures } = partition([])

    expect(nextInspectorFeatures).toEqual([])
    expect(nextUrlFeatures).toEqual([noteUrl])
  })

  test('clicking another note replaces mode detail and closes the inspector', () => {
    const { nextInspectorFeatures, nextUrlFeatures } = partition([otherNoteFeature])

    expect(nextInspectorFeatures).toEqual([])
    expect(nextUrlFeatures).toEqual([otherNoteUrl])
  })

  test('Ctrl/Cmd multi-select toggles only inspector features', () => {
    const { nextInspectorFeatures, nextUrlFeatures } = partition([otherStreetFeature], {
      multiselect: true,
    })

    expect(nextInspectorFeatures.map((feature) => feature.id)).toEqual([10, 11])
    expect(nextUrlFeatures.map((feature) => feature.id)).toEqual([10, 11, 100])
  })

  test('Ctrl/Cmd click on a note replaces mode detail and leaves inspector selection', () => {
    const { nextInspectorFeatures, nextUrlFeatures } = partition([otherNoteFeature], {
      multiselect: true,
    })

    expect(nextInspectorFeatures.map((feature) => feature.id)).toEqual([10])
    expect(nextUrlFeatures).toEqual([streetUrl, otherNoteUrl])
  })

  test('list click merges the mode slice and keeps inspector features in f', () => {
    expect(mergeModeUrlFeature([streetUrl, noteUrl], otherNoteUrl)).toEqual([
      streetUrl,
      otherNoteUrl,
    ])
  })

  test('street click drops leftover mode features that belong to another mode', () => {
    const qaUrl = {
      id: 'area-1',
      sourceId: 'qa-source',
      coordinates: [13.4, 52.5, 13.5, 52.6],
    } satisfies UrlFeature

    const { nextUrlFeatures } = partition([streetFeature], {
      previousUrlFeatures: [noteUrl, qaUrl, streetUrl],
      currentMode: 'notes',
    })

    expect(nextUrlFeatures).toEqual([streetUrl, noteUrl])
  })
})
