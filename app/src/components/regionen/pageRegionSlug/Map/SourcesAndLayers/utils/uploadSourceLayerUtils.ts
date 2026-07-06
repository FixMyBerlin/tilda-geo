import type { FeatureCollection } from 'geojson'
import { createPmtilesUrl } from './createPmtilesUrl'

// GeoJSON sources fetch their `data` URL eagerly the moment they are added to the style
// (unlike vector/pmtiles sources, which only load tiles for visible layers). Sources of
// unselected datasets therefore mount with an empty FeatureCollection and only swap to the
// real URL once the dataset is selected — mount order stays stable, no eager download.
const EMPTY_FEATURE_COLLECTION: FeatureCollection = { type: 'FeatureCollection', features: [] }

export function createUploadSourceProps({
  mapRenderFormat,
  mapRenderUrl,
  loadData,
}: {
  mapRenderFormat: string
  mapRenderUrl: string
  loadData: boolean
}) {
  return mapRenderFormat === 'geojson'
    ? { type: 'geojson' as const, data: loadData ? mapRenderUrl : EMPTY_FEATURE_COLLECTION }
    : { type: 'vector' as const, url: createPmtilesUrl(mapRenderUrl) }
}

export const UPLOAD_FALLBACK_BEFORE_ID = 'atlas-app-beforeid-fallback'

// Upload config layers may specify a beforeId anchor; default to the fallback anchor group.
export function resolveUploadBeforeId(layer: unknown & object) {
  return 'beforeId' in layer && typeof layer.beforeId === 'string' && layer.beforeId
    ? layer.beforeId
    : UPLOAD_FALLBACK_BEFORE_ID
}
