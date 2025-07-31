import { useMapParam } from '../../_hooks/useQueryState/useMapParam'
import { useQaParam } from '../../_hooks/useQueryState/useQaParam'
import { qaMinZoom } from './SourcesAndLayers/SourcesLayersQa'

export const QaZoomNotice = () => {
  const { mapParam } = useMapParam()
  const { qaParamData } = useQaParam()

  // Only show if QA is active and zoom is below the minimum zoom level
  if (
    !qaParamData.configSlug ||
    qaParamData.style === 'none' ||
    (mapParam?.zoom ?? 0) >= qaMinZoom
  ) {
    return null
  }

  return (
    <div className="absolute right-12 top-2.5 z-10 rounded border border-yellow-300 bg-yellow-100 px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-yellow-800">
        Die Daten zur Qualitätssicherung sind ab Zoomstufe {qaMinZoom}+ sichtbar
      </p>
    </div>
  )
}
