import { useMap } from 'react-map-gl/maplibre'
import type { StoreFeaturesInspector } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useOsmNotesActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import {
  useNewInternalNoteMapParam,
  useShowInternalNotesParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import type { MapDataOsmIdConfig } from '@/components/regionen/pageRegionSlug/mapData/types'
import { buttonStyles } from '@/components/shared/links/styles'
import { useAllowInternalNotes } from '../../notes/InternalNotes/utils/useAllowInternalNotes'
import { extractOsmTypeIdByConfig } from './osmUrls/extractOsmTypeIdByConfig'
import { pointFromGeometry } from './osmUrls/pointFromGeometry'

type Props = {
  properties: StoreFeaturesInspector['inspectorFeatures'][number]['properties']
  geometry: StoreFeaturesInspector['inspectorFeatures'][number]['geometry']
  osmIdConfig: MapDataOsmIdConfig
}

export const ToolsLinkNewInternalNote = ({ properties, geometry, osmIdConfig }: Props) => {
  const { mainMap } = useMap()
  const { setShowInternalNotesParam } = useShowInternalNotesParam()
  const { setOsmNewNoteFeature, setNewNoteTildaDeeplink } = useOsmNotesActions()
  const { setNewInternalNoteMapParam } = useNewInternalNoteMapParam()

  const { osmType, osmId } = extractOsmTypeIdByConfig(properties, osmIdConfig)

  const allowInternalNotes = useAllowInternalNotes()
  if (!allowInternalNotes) return null

  if (!mainMap || !properties || !geometry || !osmType || !osmId) return null

  return (
    <button
      type="button"
      className={buttonStyles}
      onClick={() => {
        setShowInternalNotesParam(true)
        setOsmNewNoteFeature({ geometry, osmType, osmId })
        setNewNoteTildaDeeplink(window.location.href)
        // Note: The zoom will be specified by the `bounds` prop in <InternalNotesNewMap/>
        // BUT it needs to be > 17 so that `roundByZoom` keeps precision of 5
        const [lng, lat] = pointFromGeometry(geometry)
        setNewInternalNoteMapParam({ zoom: 18, lng, lat })
      }}
    >
      internen Hinweis zu diesem Kartenobjekt erstellen
    </button>
  )
}
