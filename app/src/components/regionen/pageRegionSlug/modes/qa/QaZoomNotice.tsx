import { useMap } from 'react-map-gl/maplibre'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { qaMinZoom } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersQa'
import { modePanelSmallButtonClassName } from '../modePanel.const'

/** Shown at the top of the QA list while the map is below the QA layer minzoom. */
export const QaZoomNotice = () => {
  const { mapParam } = useMapParam()
  const { mainMap } = useMap()

  if ((mapParam?.zoom ?? 0) >= qaMinZoom) return null

  return (
    <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-yellow-200 bg-yellow-50 px-4 py-2">
      <p className="text-sm text-yellow-900">
        Die Daten zur Qualitätssicherung sind ab Zoomstufe {qaMinZoom}+ sichtbar.
      </p>
      <button
        type="button"
        className={`${modePanelSmallButtonClassName} shrink-0 border-yellow-300 bg-white`}
        disabled={!mainMap}
        onClick={() => {
          mainMap?.zoomTo(qaMinZoom, { duration: 600 })
        }}
      >
        Hineinzoomen
      </button>
    </div>
  )
}
