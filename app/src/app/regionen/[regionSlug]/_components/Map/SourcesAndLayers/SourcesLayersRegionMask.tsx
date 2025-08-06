import { useRegionSlug } from '@/src/app/regionen/[regionSlug]/_components/regionUtils/useRegionSlug'
import React from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { createPmtilesUrl } from './utils/createPmtilesUrl'

export const SourcesLayersRegionMask: React.FC = () => {
  const regionSlug = useRegionSlug()
  // TODO: Migrate regional masks to new pmtiles system
  const { id, url } = {
    id: 'atlas-regional-masks',
    url: 'https://atlas-tiles.s3.eu-central-1.amazonaws.com/atlas-regional-masks.pmtiles',
  }

  if (!regionSlug) return null

  return (
    <>
      <Source id="mask" key={`source:${id}`} type="vector" url={createPmtilesUrl(url)} />
      <Layer
        id="mask-buffer"
        type="fill"
        source="mask"
        source-layer="default"
        paint={{
          'fill-color': '#27272a',
          'fill-opacity': 0.8,
        }}
        filter={['all', ['==', 'region', regionSlug], ['==', 'kind', 'buffer']]}
      />
      <Layer
        id="mask-boundary"
        type="line"
        source="mask"
        source-layer="default"
        // Styles based on `atlas_mask_boundary`
        // https://studio.mapbox.com/styles/hejco/cl706a84j003v14o23n2r81w7/edit/#8.92/52.4306/13.5216
        paint={{
          'line-dasharray': ['step', ['zoom'], ['literal', [2, 0]], 7, ['literal', [2, 2, 6, 2]]],
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.7, 12, 1.5],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 2, 0, 3, 1, 9, 1, 10, 0.1],
          'line-color': '#dfa762',
        }}
        filter={['all', ['==', 'region', regionSlug], ['==', 'kind', 'boundary']]}
      />
      <Layer
        id="mask-boundary-bg"
        type="line"
        source="mask"
        source-layer="default"
        paint={{
          'line-color': 'hsl(45, 2%, 80%)',
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 3, 12, 6],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 8, 0.5, 9, 0.5, 10, 0.1],
          'line-dasharray': [1, 0],
          'line-blur': ['interpolate', ['linear'], ['zoom'], 3, 0, 12, 3],
        }}
        filter={['all', ['==', 'region', regionSlug], ['==', 'kind', 'boundary']]}
      />
    </>
  )
}
