import type { SubcategoryId } from '@/components/regionen/pageRegionSlug/mapData/typeId'
import type {
  FileMapDataSubcategoryHiddenStyle,
  FileMapDataSubcategoryStyle,
  FileMapDataSubcategoryStyleLegend,
} from '@/components/regionen/pageRegionSlug/mapData/types'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { createSubcatStyleKey } from '../../utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { DetailToggle } from '../DetailToggle'
import { useLegendExpanded, useLegendExpandedActions } from './legend-expanded-store'
import { LegendIconArea } from './LegendIcons/LegendIconArea'
import { LegendIconCircle } from './LegendIcons/LegendIconCircle'
import { LegendIconHeatmap } from './LegendIcons/LegendIconHeatmap'
import { LegendIconLine } from './LegendIcons/LegendIconLine'
import { LegendIconText } from './LegendIcons/LegendIconText'
import type { LegendIconTypes } from './LegendIcons/types'
import { LegendNameDesc } from './LegendNameDesc'

/** Longer legends start collapsed as an icon grid; expand to the full list. */
const LEGEND_COMPACT_THRESHOLD = 3

type Props = {
  subcategoryId: SubcategoryId
  styleConfig: FileMapDataSubcategoryStyle | FileMapDataSubcategoryHiddenStyle | undefined
}

const iconFromLegend = (legend: FileMapDataSubcategoryStyleLegend) => {
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
    case 'symbol':
      return <LegendIconText color={color} />
    default:
      return <>TODO</>
  }
}

/** Layer-config legend names may include light HTML (`<br>`, `&nbsp;`). Tooltips need plain text. */
const legendLabelPlain = (name: string) =>
  new DOMParser().parseFromString(name, 'text/html').body.textContent?.trim() ?? ''

const LegendList = ({ legends }: { legends: FileMapDataSubcategoryStyleLegend[] }) => (
  <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 @[17rem]:grid-cols-2">
    {legends.map((legendData) => {
      return (
        <div className="group relative flex items-start gap-1.5" key={legendData.id}>
          <div className="size-3.5 flex-none">{iconFromLegend(legendData)}</div>
          <LegendNameDesc name={legendData.name} desc={legendData.desc} />
        </div>
      )
    })}
  </div>
)

const LegendCompactGrid = ({ legends }: { legends: FileMapDataSubcategoryStyleLegend[] }) => (
  // Negative margin: cells pad the swatch for the hover target; without it the swatches sit
  // further from the toggle and the left edge than the icons of the detailed list.
  <div className="-m-0.75 grid w-full grid-cols-[repeat(auto-fill,minmax(1.25rem,1.25rem))]">
    {legends.map((legendData) => {
      const label = legendLabelPlain(legendData.name)

      return (
        <Tooltip key={legendData.id} text={label} placement="left" className="size-5">
          <div className="flex size-5 cursor-help items-center justify-center hover:bg-black/5">
            <div className="size-3.5">{iconFromLegend(legendData)}</div>
          </div>
        </Tooltip>
      )
    })}
  </div>
)

/**
 * Legend entries with the compact ⇄ detailed toggle; shared by TILDA layers and static datasets.
 * `legendKey` identifies the legend in the session store that remembers the expanded state.
 */
export const LegendItems = ({
  legendKey,
  legends,
}: {
  legendKey: string
  legends: FileMapDataSubcategoryStyleLegend[]
}) => {
  const expanded = useLegendExpanded(legendKey)
  const { expand, collapse } = useLegendExpandedActions()

  const canToggle = legends.length > LEGEND_COMPACT_THRESHOLD
  const useCompact = canToggle && !expanded

  return (
    <div className="@container space-y-1.5">
      {canToggle && (
        <DetailToggle
          expanded={expanded}
          onToggle={() => (expanded ? collapse(legendKey) : expand(legendKey))}
          label={expanded ? 'Kompakte Legende' : 'Detaillierte Legende'}
        />
      )}
      {useCompact ? (
        <LegendCompactGrid legends={legends} />
      ) : (
        /* Container query: two columns once the legend has room (e.g. the mobile layer
            sheet); the narrower desktop sidebar stays a single column. */
        <LegendList legends={legends} />
      )}
    </div>
  )
}

export const Legend = ({ subcategoryId, styleConfig }: Props) => {
  const legends = styleConfig?.legends

  // Guard: Hide UI when no legends present for active style
  if (!styleConfig || !legends?.length) {
    return null
  }

  return (
    <section className="relative mt-2 mb-1">
      <header className="sr-only">Legende</header>
      <LegendItems
        legendKey={createSubcatStyleKey(subcategoryId, styleConfig.id)}
        legends={legends}
      />
    </section>
  )
}
