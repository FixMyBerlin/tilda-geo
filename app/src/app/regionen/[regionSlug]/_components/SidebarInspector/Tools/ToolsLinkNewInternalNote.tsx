import { buttonStyles } from '@/src/app/_components/links/styles'
import { useMap } from 'react-map-gl/maplibre'
import { StoreFeaturesInspector } from '../../../_hooks/mapState/useMapState'
import { useOsmNotesActions } from '../../../_hooks/mapState/userMapNotes'
import {
  useNewInternalNoteMapParam,
  useShowInternalNotesParam,
} from '../../../_hooks/useQueryState/useNotesAtlasParams'
import { MapDataOsmIdConfig } from '../../../_mapData/types'
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
