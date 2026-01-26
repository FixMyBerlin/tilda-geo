import { LegendId, SubcategoryId } from '../../../_mapData/typeId'
import {
  FileMapDataSubcategoryHiddenStyle,
  FileMapDataSubcategoryStyle,
  FileMapDataSubcategoryStyleLegend,
} from '../../../_mapData/types'
import { createSubcatStyleLegendKey } from '../../utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { LegendIconArea } from './LegendIcons/LegendIconArea'
import { LegendIconCircle } from './LegendIcons/LegendIconCircle'
import { LegendIconHeatmap } from './LegendIcons/LegendIconHeatmap'
import { LegendIconLine } from './LegendIcons/LegendIconLine'
import { LegendIconText } from './LegendIcons/LegendIconText'
import { LegendIconTypes } from './LegendIcons/types'
import { LegendNameDesc } from './LegendNameDesc'

type Props = {
  subcategoryId: SubcategoryId
  styleConfig: FileMapDataSubcategoryStyle | FileMapDataSubcategoryHiddenStyle | undefined
}

export const iconFromLegend = (legend: FileMapDataSubcategoryStyleLegend) => {
  if (!legend?.style?.type && !legend?.style?.color) {
    console.warn('pickIconFromLegend: missing data', {
      type: legend?.style?.type,
      style: legend?.style?.color,
    })
    return null
  }
  const { type, color, width, dasharray } = legend.style
  return iconByStyle({ type, color, width, dasharray })
}

const iconByStyle = ({
  type,
  color,
  width,
  dasharray,
}: {
  type: LegendIconTypes
  color: FileMapDataSubcategoryStyleLegend['style']['color']
  width?: FileMapDataSubcategoryStyleLegend['style']['width']
  dasharray?: FileMapDataSubcategoryStyleLegend['style']['dasharray']
}) => {
  switch (type) {
    case 'line':
      return (
        <LegendIconLine color={color} width={width || 4} strokeDasharray={dasharray?.join(',')} />
      )
    // TODO: Rename to lineBorder and introduce circleBorder, maybe fillBorder
    // TOOD: And maybe rename fill to area or square?
    case 'border':
      return (
        <div className="relative h-full w-full">
          <div className="absolute inset-0.5 z-10">
            <LegendIconLine color="white" width={4} strokeDasharray={dasharray?.join(',')} />
          </div>
          <div className="absolute inset-0 z-0">
            <LegendIconLine color={color} width={7} strokeDasharray={dasharray?.join(',')} />
          </div>
        </div>
      )
    case 'circle':
      return <LegendIconCircle color={color} className="h-full w-full" />
    case 'fill':
      return <LegendIconArea color={color} />
    case 'text':
      return <LegendIconText color={color} />
    case 'heatmap':
      return <LegendIconHeatmap color={color} />
    default:
      return <>TODO</>
  }
}

export const Legend = ({ subcategoryId, styleConfig }: Props) => {
  const legends = styleConfig?.legends
  // Guard: Hide UI when no legends present for active style
  if (!styleConfig || !legends?.length) {
    return null
  }

  return (
    <section className="relative mt-2 mb-1 w-full overflow-hidden">
      <header className="sr-only">Legende</header>
      <div className="space-y-1">
        {legends.map((legendData) => {
          // TODO: TS: This should be specified at the source…
          const legendDataId = legendData.id as LegendId
          const key = createSubcatStyleLegendKey(subcategoryId, styleConfig.id, legendDataId)

          return (
            <div className="group relative flex min-w-0 items-start gap-2" key={key}>
              <div className="size-4 flex-none">{iconFromLegend(legendData)}</div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <LegendNameDesc name={legendData.name} desc={legendData.desc} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
