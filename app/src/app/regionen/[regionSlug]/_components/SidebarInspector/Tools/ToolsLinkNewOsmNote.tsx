import { buttonStyles } from '@/src/app/_components/links/styles'
import { useMap } from 'react-map-gl/maplibre'
import { StoreFeaturesInspector } from '../../../_hooks/mapState/useMapState'
import { useOsmNotesActions } from '../../../_hooks/mapState/userMapNotes'
import {
  useNewOsmNoteMapParam,
  useShowOsmNotesParam,
} from '../../../_hooks/useQueryState/useNotesOsmParams'
import { MapDataOsmIdConfig } from '../../../_mapData/types'
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
  const { setOsmNewNoteFeature } = useOsmNotesActions()
  const { setNewOsmNoteMapParam } = useNewOsmNoteMapParam()

  const [lng, lat] = pointFromGeometry(geometry)

  const { osmType, osmId } = extractOsmTypeIdByConfig(properties, osmIdConfig)

  if (!mainMap || !lng || !lat || !properties || !geometry || !osmType || !osmId) return null

  return (
    <button
      className={buttonStyles}
      onClick={() => {
        setShowOsmNotesParam(true)
        setOsmNewNoteFeature({ geometry, osmType, osmId })
        // Note: The zoom will be specified by the `bounds` prop in <OsmNotesNewMap/>
        // BUT it needs to be > 17 so that `roundByZoom` keeps precision of 5
        setNewOsmNoteMapParam({ zoom: 18, lng, lat })
      }}
    >
      Hinweis zu diesem Kartenobjekt erstellen
    </button>
  )
}
