import { ClientFilterRow } from '@/components/shared/FilterRow/ClientFilterRow'
import type { FilterRowItem } from '@/components/shared/FilterRow/types'
import { topicIds, type TopicId } from '@/data/processingTypes/topicId.generated.const'
import type { ChartPhaseFilter } from '@/server/processing/parseTopicTimings'
import { getTopicLuaDotFillClass } from '@/server/processing/topicChartColors'

type TopicFilter = TopicId | 'all'

type Props = {
  topicFilter: TopicFilter
  phaseFilter: ChartPhaseFilter
  onTopicFilterChange: (value: TopicFilter) => void
  onPhaseFilterChange: (value: ChartPhaseFilter) => void
}

const topicItems: FilterRowItem[] = [
  { id: 'all', label: 'Alle' },
  ...topicIds.map((topicId) => ({
    id: topicId,
    label: topicId,
    dotFillClassName: getTopicLuaDotFillClass(topicId),
  })),
]

const phaseItems: FilterRowItem[] = [
  { id: 'both', label: 'Beides' },
  { id: 'lua', label: 'Lua' },
  { id: 'sql', label: 'SQL' },
]

export const ProcessingChartFilters = ({
  topicFilter,
  phaseFilter,
  onTopicFilterChange,
  onPhaseFilterChange,
}: Props) => {
  return (
    <div className="space-y-3">
      <ClientFilterRow
        sectionLabel="Topics"
        ariaLabel="Topics"
        items={topicItems}
        activeId={topicFilter}
        onChange={onTopicFilterChange}
      />
      <ClientFilterRow
        sectionLabel="Phase"
        ariaLabel="Phase"
        items={phaseItems}
        activeId={phaseFilter}
        onChange={onPhaseFilterChange}
      />
    </div>
  )
}
