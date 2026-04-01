import type { InspectorFeatureProperty } from '../../Inspector'
import type { TagsTableRowProps } from '../TagsTableRow'

export type CompositTableRow = Pick<TagsTableRowProps, 'sourceId' | 'tagKey'> & {
  properties: InspectorFeatureProperty
}
