import type { CompositTableRow } from '../compositTableRows/types'
import type { InspectorChart } from './inspectorChart.schema'
import { TagsTableRowPie } from './TagsTableRowPie'
import { TagsTableRowShareBar } from './TagsTableRowShareBar'

type Props = CompositTableRow & { chart: InspectorChart }

export const TagsTableRowChart = ({ chart, ...props }: Props) => {
  switch (chart.type) {
    case 'shareBar':
      return <TagsTableRowShareBar chart={chart} {...props} />
    case 'pie':
      return <TagsTableRowPie chart={chart} {...props} />
  }
}
