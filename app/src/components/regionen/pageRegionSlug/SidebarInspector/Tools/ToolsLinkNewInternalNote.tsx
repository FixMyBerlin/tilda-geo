import { useNavigate } from '@tanstack/react-router'
import { bbox } from '@turf/turf'
import { useMap } from 'react-map-gl/maplibre'
import type { StoreFeaturesInspector } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useOsmNotesActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import { serializeMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParam'
import type { MapDataOsmIdConfig } from '@/components/regionen/pageRegionSlug/mapData/types'
import { useAllowInternalNotes } from '@/components/regionen/pageRegionSlug/modes/notes/useAllowInternalNotes'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { buttonStyles } from '@/components/shared/links/styles'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { extractOsmTypeIdByConfig } from './osmUrls/extractOsmTypeIdByConfig'
import { pointFromGeometry } from './osmUrls/pointFromGeometry'

type Props = {
  properties: StoreFeaturesInspector['inspectorFeatures'][number]['properties']
  geometry: StoreFeaturesInspector['inspectorFeatures'][number]['geometry']
  osmIdConfig: MapDataOsmIdConfig
}

export const ToolsLinkNewInternalNote = ({ properties, geometry, osmIdConfig }: Props) => {
  const { mainMap } = useMap()
  const navigate = useNavigate({ from: '/regionen/$regionSlug' })
  const { setOsmNewNoteFeature, setNewNoteTildaDeeplink } = useOsmNotesActions()
  const { clearInspectorFeatures } = useMapActions()
  const region = useRegion()

  const { osmType, osmId } = extractOsmTypeIdByConfig(properties, osmIdConfig)

  const allowInternalNotes = useAllowInternalNotes()
  if (!allowInternalNotes || !region) return null

  if (!mainMap || !properties || !geometry || !osmType || !osmId) return null

  return (
    <button
      type="button"
      className={buttonStyles}
      onClick={() => {
        setOsmNewNoteFeature({ geometry, osmType, osmId })
        setNewNoteTildaDeeplink(window.location.href)
        clearInspectorFeatures()
        // Zoom > 17 so roundByZoom keeps 5 decimal places if the create param is bookmarked.
        const [lng, lat] = pointFromGeometry(geometry)
        const bounds = bbox(geometry) as [number, number, number, number]
        mainMap.fitBounds(bounds, { padding: 100, maxZoom: 17 })
        void navigate({
          to: '/regionen/$regionSlug/hinweise',
          search: (prev) => {
            const next = { ...prev }
            next[searchParamsRegistry.internalNote] = serializeMapParam({ zoom: 18, lng, lat })
            delete next[searchParamsRegistry.f]
            return next
          },
          replace: true,
        })
      }}
    >
      internen Hinweis zu diesem Kartenobjekt erstellen
    </button>
  )
}
