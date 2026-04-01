import { useEffect } from 'react'
import { useMapLoaded } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useDrawParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDrawParam'
import type { MapDataSourceCalculator } from '@/components/regionen/pageRegionSlug/mapData/types'
import type { DrawArea, DrawControlProps } from './CalculatorControlsDrawControl'
import { CalculatorControlsDrawControl } from './CalculatorControlsDrawControl'
import { useDelete } from './hooks/useDelete'
import { useUpdate } from './hooks/useUpdate'
import { useUpdateCalculation } from './utils/useUpdateCalculation'

type Props = {
  queryLayers: MapDataSourceCalculator['queryLayers']
  drawControlRef: DrawControlProps['ref']
}

export const CalculatorControls = ({ queryLayers, drawControlRef }: Props) => {
  const { drawParam } = useDrawParam()
  const mapLoaded = useMapLoaded()
  const { updateCalculation } = useUpdateCalculation()

  // Update the URL, extracted as hook
  const { updateDrawFeatures } = useUpdate()
  const onUpdate = (e: { features: DrawArea[] }) => {
    updateDrawFeatures(drawParam, e.features)
    updateCalculation(queryLayers, drawParam)
  }

  // Update the URL, extracted as hook
  const { deleteDrawFeatures } = useDelete()
  const onDelete = (e: { features: DrawArea[] }) => {
    deleteDrawFeatures(drawParam, e.features)
    updateCalculation(queryLayers, drawParam)
  }

  // OnInit, add drawAreas from store to the UI
  useEffect(
    function populateDrawControlFromUrlState() {
      if (!mapLoaded || !drawParam?.length) return
      if (!drawControlRef || typeof drawControlRef === 'function' || !('current' in drawControlRef))
        return

      drawParam.forEach((feature) => {
        // .add does not trigger draw.update, so we need to do this manually
        drawControlRef.current?.add(feature)
        updateCalculation(queryLayers, drawParam)
      })
    },
    [mapLoaded, drawParam, drawControlRef, queryLayers, updateCalculation],
  )

  return (
    <CalculatorControlsDrawControl
      ref={drawControlRef}
      position="top-left"
      displayControlsDefault={false}
      controls={{
        polygon: true,
        trash: true,
      }}
      onCreate={onUpdate}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  )
}
