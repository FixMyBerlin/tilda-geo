import type { Topic, TopicConfigEntry } from '../constants/topics.const'
import { params } from './parameters'

export type TopicScheduleSkipReason = 'weekend' | 'process_only'

export function getTopicScheduleSkipReason(
  topic: Topic,
  entry: TopicConfigEntry,
  isSaturdayRun: boolean,
) {
  if (entry.schedule === 'weekend' && !isSaturdayRun && !params.processOnlyTopics.includes(topic)) {
    return 'weekend'
  }

  if (params.processOnlyTopics.length > 0 && !params.processOnlyTopics.includes(topic)) {
    return 'process_only'
  }

  return null
}
