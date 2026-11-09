import { lazy, Suspense } from 'react'
import { TagsTableRow } from '../TagsTableRow'
import type { CompositTableRow } from './types'

const TrafficSignTagsTableRow = lazy(() => import('./TrafficSignTagsTableRow'))

export const tableKeyTrafficSign = 'traffic_sign'
export const TagsTableRowCompositTrafficSign = (props: CompositTableRow) => {
  const { sourceId, tagKey, properties } = props
  return (
    <Suspense
      fallback={<TagsTableRow sourceId={sourceId} tagKey={tagKey} tagValue={properties[tagKey]} />}
    >
      <TrafficSignTagsTableRow {...props} />
    </Suspense>
  )
}
