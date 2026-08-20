import { differenceInMilliseconds } from 'date-fns'
import { afterthoughtIds } from '@/data/processingTypes/afterthoughts.const'
import { countRunTopics, parseOrphanedRunTopics, parseRunTopics } from './parseTopicTimings'
import { isAfterthoughtSkipped, type ProcessingRunRow } from './schemas'

const SLOWEST_TOPICS_LIMIT = 5

const runHeader = (run: ProcessingRunRow) => ({
  id: run.id,
  status: run.status,
  processing_duration: run.processing_duration,
  osm_data_from: run.osm_data_from,
  processing_started_at: run.processing_started_at,
  processing_completed_at: run.processing_completed_at,
  qa_update_started_at: run.qa_update_started_at,
  qa_update_completed_at: run.qa_update_completed_at,
})

const slowestTopics = (run: ProcessingRunRow) => {
  const ranked = parseRunTopics(run.topics)
    .filter(
      (topic): topic is typeof topic & { totalMs: number } =>
        topic.status === 'completed' && topic.totalMs !== undefined,
    )
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, SLOWEST_TOPICS_LIMIT)

  return ranked.map((topic) => ({ topicId: topic.topicId, totalMs: topic.totalMs }))
}

const parseAfterthoughts = (run: ProcessingRunRow) =>
  afterthoughtIds.map((afterthoughtId) => {
    const entry = run.afterthoughts[afterthoughtId]
    if (!entry) {
      return { afterthoughtId, status: 'not_recorded' as const }
    }
    if (isAfterthoughtSkipped(entry)) {
      return {
        afterthoughtId,
        status: 'skipped' as const,
        skipReason: entry.skipped,
      }
    }
    return {
      afterthoughtId,
      status: 'completed' as const,
      durationMs: differenceInMilliseconds(new Date(entry.end), new Date(entry.start)),
    }
  })

export const mapProcessingRunListItem = (run: ProcessingRunRow) => ({
  ...runHeader(run),
  topicCounts: countRunTopics(run.topics),
  slowestTopics: slowestTopics(run),
})

export const mapProcessingRunDetail = (run: ProcessingRunRow, topic?: string) => {
  const knownTopics = parseRunTopics(run.topics)
  const orphanedTopics = parseOrphanedRunTopics(run.topics)

  return {
    ...runHeader(run),
    topicCounts: countRunTopics(run.topics),
    topics: topic === undefined ? knownTopics : knownTopics.filter((row) => row.topicId === topic),
    orphanedTopics:
      topic === undefined ? orphanedTopics : orphanedTopics.filter((row) => row.topicId === topic),
    afterthoughts: parseAfterthoughts(run),
  }
}
