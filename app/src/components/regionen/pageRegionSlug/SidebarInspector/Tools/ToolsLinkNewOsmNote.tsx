import { useMap } from 'react-map-gl/maplibre'
import type { StoreFeaturesInspector } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useOsmNotesActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import {
  useNewOsmNoteMapParam,
  useShowOsmNotesParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesOsmParams'
import type { MapDataOsmIdConfig } from '@/components/regionen/pageRegionSlug/mapData/types'
import { useStaticRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useStaticRegion'
import { buttonStyles } from '@/components/shared/links/styles'
import { extractOsmTypeIdByConfig } from './osmUrls/extractOsmTypeIdByConfig'
import { pointFromGeometry } from './osmUrls/pointFromGeometry'

type Props = {
  properties: StoreFeaturesInspector['inspectorFeatures'][number]['properties']
  geometry: StoreFeaturesInspector['inspectorFeatures'][number]['geometry']
  osmIdConfig: MapDataOsmIdConfig
}

export const ToolsLinkNewOsmNote = ({ properties, geometry, osmIdConfig }: Props) => {
  const { mainMap } = useMap()
  const { setShowOsmNotesParam } = useShowOsmNotesParam()
  const { setOsmNewNoteFeature, setNewNoteTildaDeeplink } = useOsmNotesActions()
  const { setNewOsmNoteMapParam } = useNewOsmNoteMapParam()

  const { osmType, osmId } = extractOsmTypeIdByConfig(properties, osmIdConfig)

  const region = useStaticRegion()
  if (!region || region.notes !== 'osmNotes') return null

  if (!mainMap || !properties || !geometry || !osmType || !osmId) return null

  return (
    <button
      type="button"
      className={buttonStyles}
      onClick={() => {
        setShowOsmNotesParam(true)
        setOsmNewNoteFeature({ geometry, osmType, osmId })
        setNewNoteTildaDeeplink(window.location.href)
        // Note: The zoom will be specified by the `bounds` prop in <OsmNotesNewMap/>
        // BUT it needs to be > 17 so that `roundByZoom` keeps precision of 5
        const [lng, lat] = pointFromGeometry(geometry)
        setNewOsmNoteMapParam({ zoom: 18, lng, lat })
      }}
    >
      Hinweis zu diesem Kartenobjekt erstellen
    </button>
  )
}
