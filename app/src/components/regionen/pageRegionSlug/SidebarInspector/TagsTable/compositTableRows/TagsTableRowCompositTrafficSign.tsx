import { Suspense, use } from 'react'
import { Img } from '@/components/shared/Img'
import { TagsTableRow } from '../TagsTableRow'
import { ConditionalFormattedKey } from '../translations/ConditionalFormattedKey'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { getTrafficSignSvgPromise } from '../utils/trafficSignBundledSvg'
import { parseTrafficSignTag } from '../utils/trafficSignFromTag'
import type { TrafficSignDisplayItem } from '../utils/trafficSignFromTag'
import { NodataFallback } from './NodataFallback'
import type { CompositTableRow } from './types'

export const tableKeyTrafficSign = 'traffic_sign'
export const TagsTableRowCompositTrafficSign = ({
  sourceId,
  tagKey,
  properties,
}: CompositTableRow) => {
  type Signs = {
    both: ReturnType<typeof parseTrafficSignTag>
    forward: ReturnType<typeof parseTrafficSignTag>
    backward: ReturnType<typeof parseTrafficSignTag>
  }
  const receivedSigns: Signs = {
    both: parseTrafficSignTag(properties.traffic_sign),
    forward: parseTrafficSignTag(properties['traffic_sign:forward']),
    backward: parseTrafficSignTag(properties['traffic_sign:backward']),
  }

  const anySigns = Object.values(receivedSigns).flat().filter(Boolean).length > 0
  if (!anySigns) {
    return (
      <TagsTableRow
        key={tagKey}
        sourceId={sourceId}
        tagKey={tagKey}
        tagValue={properties[tagKey]}
      />
    )
  }

  // CASE: Show only 'both'
  if (
    receivedSigns.both &&
    receivedSigns.forward === undefined &&
    receivedSigns.backward === undefined
  ) {
    return (
      <TagsTableRow key={tagKey} sourceId={sourceId} tagKey={tagKey}>
        <Signs sourceId={sourceId} items={receivedSigns.both} />
      </TagsTableRow>
    )
  }

  // CASE: Show all variations
  return (
    <TagsTableRow key={tagKey} sourceId={sourceId} tagKey={tagKey}>
      <div className="flex flex-col gap-3">
        {receivedSigns.both && <Signs sourceId={sourceId} items={receivedSigns.both} />}
        {(receivedSigns.forward || receivedSigns.backward) && (
          <>
            <Signs
              sourceId={sourceId}
              titleTag="traffic_sign:forward"
              items={receivedSigns.forward}
            />
            <Signs
              sourceId={sourceId}
              titleTag="traffic_sign:backward"
              items={receivedSigns.backward}
            />
          </>
        )}
      </div>
    </TagsTableRow>
  )
}

function Signs({
  sourceId,
  titleTag,
  items,
}: {
  sourceId: string
  titleTag?: string
  items: TrafficSignDisplayItem[] | undefined
}) {
  const firstKey = items?.[0]?.key

  return (
    <div>
      {titleTag && (
        <strong className="font-medium">
          <ConditionalFormattedKey sourceId={sourceId} tagKey={titleTag} />:
        </strong>
      )}
      {items === undefined ? (
        <NodataFallback />
      ) : // `traffic_sign=never` is an internal sentinel used when no sign is expected
      // (for example category=cyclewayOnHighwayBetweenLanes).
      firstKey === 'none' || firstKey === 'never' ? (
        <ConditionalFormattedValue sourceId={sourceId} tagKey="traffic_sign" tagValue={firstKey} />
      ) : (
        <div className="flex divide-x">
          {items.map((item) => (
            <Sign key={item.key} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function TrafficSignImg({ svgName }: { svgName: string }) {
  const src = use(getTrafficSignSvgPromise(svgName))
  if (!src) return null
  return <Img src={src} width={48} height={48} alt="" className="h-12 max-w-12" />
}

function Sign({ item }: { item: TrafficSignDisplayItem }) {
  const showImage = item.recognized && item.svgName

  return (
    <div className="flex flex-col items-start justify-center px-3 first:pl-0 last:pr-0">
      <p className={showImage ? 'mb-1 leading-tight' : 'leading-tight'}>{item.label}</p>
      {item.svgName && (
        <Suspense fallback={null}>
          <TrafficSignImg svgName={item.svgName} />
        </Suspense>
      )}
    </div>
  )
}
