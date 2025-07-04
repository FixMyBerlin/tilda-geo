import { buttonStyles } from '@/src/app/_components/links/styles'
import { useMap } from 'react-map-gl/maplibre'
import { StoreFeaturesInspector } from '../../../_hooks/mapState/useMapState'
import { useOsmNotesActions } from '../../../_hooks/mapState/userMapNotes'
import {
  useNewAtlasNoteMapParam,
  useShowAtlasNotesParam,
} from '../../../_hooks/useQueryState/useNotesAtlasParams'
import { MapDataOsmIdConfig } from '../../../_mapData/types'
import { useAllowAtlasNotes } from '../../notes/AtlasNotes/utils/useAllowAtlasNotes'
import { extractOsmTypeIdByConfig } from './osmUrls/extractOsmTypeIdByConfig'
import { pointFromGeometry } from './osmUrls/pointFromGeometry'

type Props = {
  properties: StoreFeaturesInspector['inspectorFeatures'][number]['properties']
  geometry: StoreFeaturesInspector['inspectorFeatures'][number]['geometry']
  osmIdConfig: MapDataOsmIdConfig
}

export const ToolsLinkNewAtlasNote = ({ properties, geometry, osmIdConfig }: Props) => {
  const { mainMap } = useMap()
  const { setShowAtlasNotesParam } = useShowAtlasNotesParam()
  const { setOsmNewNoteFeature, setNewNoteTildaDeeplink } = useOsmNotesActions()
  const { setNewAtlasNoteMapParam } = useNewAtlasNoteMapParam()

  const { osmType, osmId } = extractOsmTypeIdByConfig(properties, osmIdConfig)

  const allowAtlasNotes = useAllowAtlasNotes()
  if (!allowAtlasNotes) return null

  if (!mainMap || !properties || !geometry || !osmType || !osmId) return null

  return (
    <button
      className={buttonStyles}
      onClick={() => {
        setShowAtlasNotesParam(true)
        setOsmNewNoteFeature({ geometry, osmType, osmId })
        setNewNoteTildaDeeplink(window.location.href)
        // Note: The zoom will be specified by the `bounds` prop in <AtlasNotesNewMap/>
        // BUT it needs to be > 17 so that `roundByZoom` keeps precision of 5
        const [lng, lat] = pointFromGeometry(geometry)
        setNewAtlasNoteMapParam({ zoom: 18, lng, lat })
      }}
    >
      internen Hinweis zu diesem Kartenobjekt erstellen
    </button>
  )
}
