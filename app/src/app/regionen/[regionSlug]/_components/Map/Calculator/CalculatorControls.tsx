import { useDrawParam } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useDrawParam'
import { useEffect } from 'react'
import { useMapLoaded } from '../../../_hooks/mapState/useMapState'
import { MapDataSourceCalculator } from '../../../_mapData/types'
import {
  CalculatorControlsDrawControl,
  DrawArea,
  DrawControlProps,
} from './CalculatorControlsDrawControl'
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
  useEffect(() => {
    if (!mapLoaded || !drawParam || !drawParam.length) return

    drawParam.forEach((feature) => {
      // .add does not trigger draw.update, so we need to do this manually
      drawControlRef.current?.add(feature)
      updateCalculation(queryLayers, drawParam)
    })
    // We have to overwrite the dependency array rule here because something causes infinite loops
    // TODO we need to find a better way of doing this …
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, drawParam, drawControlRef])

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
