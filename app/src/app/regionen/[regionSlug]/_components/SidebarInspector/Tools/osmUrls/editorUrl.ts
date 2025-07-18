import { MapDataSourceInspectorEditor } from '@/src/app/regionen/[regionSlug]/_mapData/types'
import { OsmTypeId } from './extractOsmTypeIdByConfig'
import { pointFromGeometry } from './pointFromGeometry'
import { shortOsmType } from './shortLongOsmType'

export type EditorUrlGeometry = GeoJSON.Feature['geometry']

type Props = {
  urlTemplate: MapDataSourceInspectorEditor['urlTemplate']
  geometry: EditorUrlGeometry
  osmTypeId?: OsmTypeId
  editorId?: MapDataSourceInspectorEditor['idKey']
  zoom?: number
}

export const editorUrl = ({ urlTemplate, geometry, osmTypeId, editorId, zoom }: Props) => {
  const [lng, lat] = pointFromGeometry(geometry)
  if (!lng || !lat) return undefined

  return urlTemplate
    .toString()
    .replaceAll('{zoom}', zoom?.toString() ?? '19')
    .replaceAll('{latitude}', lat.toString())
    .replaceAll('{longitude}', lng.toString())
    .replaceAll('{short_osm_type}', osmTypeId?.osmType ? shortOsmType[osmTypeId?.osmType] : '')
    .replaceAll('{long_osm_type}', osmTypeId?.osmType || '')
    .replaceAll('{editor_id}', editorId || '')
    .replaceAll('{osm_id}', osmTypeId?.osmId?.toString() ?? '')
}
