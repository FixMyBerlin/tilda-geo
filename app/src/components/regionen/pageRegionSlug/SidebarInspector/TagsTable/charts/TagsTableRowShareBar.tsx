import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import type { CompositTableRow } from '../compositTableRows/types'
import { TagsTableRow } from '../TagsTableRow'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { cleanKey, KEY_IF_PRESENCE } from '../utils/cleanKey'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from '../ValueDisclosure'
import { ChartSwatch } from './ChartSwatch'
import type { InspectorShareBarChart } from './inspectorChart.schema'
import { parseShares, type Share } from './parseShares'

const DEFAULT_FALLBACK_COLOR = '#9ca3af' // gray-400

type Props = CompositTableRow & { chart: InspectorShareBarChart }

export const TagsTableRowShareBar = ({
  sourceId,
  tagKey: uncleanKey,
  properties,
  chart,
}: Props) => {
  const tagKey = cleanKey(uncleanKey)
  const value = properties[tagKey]
  const shares = parseShares(value)
  // The text lists the value of the feature first, so that entry is shown until another one is hovered.
  const [activeIndex, setActiveIndex] = useState(0)

  if (!shares) {
    if (!value && uncleanKey.includes(KEY_IF_PRESENCE)) return null
    return <TagsTableRow sourceId={sourceId} tagKey={tagKey} tagValue={value ?? null} />
  }

  const colorOf = (share: Share) =>
    chart.colors[share.label] ?? chart.fallbackColor ?? DEFAULT_FALLBACK_COLOR
  const labelOf = (share: Share) =>
    chart.translationKey ? (
      <ConditionalFormattedValue
        sourceId={sourceId}
        tagKey={chart.translationKey}
        tagValue={share.label}
      />
    ) : (
      share.label
    )
  const activeShare = shares[activeIndex] ?? shares[0]!
  const legendOf = (share: Share) => (
    <div className="flex items-start gap-1.5">
      <ChartSwatch color={colorOf(share)} />
      <span>
        {share.percentText} {labelOf(share)}
      </span>
    </div>
  )

  return (
    <TagsTableRow sourceId={sourceId} tagKey={tagKey}>
      <ValueDisclosure>
        <ValueDisclosureButton>
          <div
            className="flex h-3 w-full gap-px overflow-hidden rounded-sm"
            onPointerLeave={() => setActiveIndex(0)}
          >
            {shares.map((share, index) => (
              <div
                key={`${share.label}-${index}`}
                style={{ width: `${share.width}%`, backgroundColor: colorOf(share) }}
                className={twJoin(
                  'h-full min-w-0.5 transition-opacity',
                  activeIndex !== index && 'opacity-60',
                )}
                onPointerEnter={() => setActiveIndex(index)}
              />
            ))}
          </div>
          <div className="mt-1">{legendOf(activeShare)}</div>
        </ValueDisclosureButton>
        <ValueDisclosurePanel>
          <ul className="space-y-0.5">
            {shares.map((share, index) => (
              <li key={`${share.label}-${index}`}>{legendOf(share)}</li>
            ))}
          </ul>
        </ValueDisclosurePanel>
      </ValueDisclosure>
    </TagsTableRow>
  )
}
