import { describe, expect, it } from 'vitest'
import { mapProcessingRunDetail, mapProcessingRunListItem } from './mapProcessingRunTimings'
import type { ProcessingRunRow } from './schemas'

const baseRun = {
  id: 42,
  status: 'processed',
  processing_duration: '1:02:03',
  osm_data_from: new Date('2026-08-18T00:00:00Z'),
  processing_started_at: new Date('2026-08-19T01:00:00Z'),
  processing_completed_at: new Date('2026-08-19T02:02:03Z'),
  qa_update_started_at: null,
  qa_update_completed_at: null,
  topics: {
    roads_bikelanes: {
      lua: { start: '2026-08-19T01:00:00Z', end: '2026-08-19T01:10:00Z' },
      sql: { start: '2026-08-19T01:10:00Z', end: '2026-08-19T01:40:00Z' },
    },
    parking: { skipped: 'weekend' },
    unknown_orphan: {
      lua: { start: '2026-08-19T01:00:00Z', end: '2026-08-19T01:05:00Z' },
    },
  },
  afterthoughts: {
    statistics: { start: '2026-08-19T02:00:00Z', end: '2026-08-19T02:01:00Z' },
    campaign_counts: { skipped: 'unchanged' },
  },
} satisfies ProcessingRunRow

describe('mapProcessingRunListItem', () => {
  it('returns counts and slowest completed topics without full topic rows', () => {
    const item = mapProcessingRunListItem(baseRun)
    expect(item.id).toBe(42)
    expect(item.topicCounts).toEqual({ completed: 1, skipped: 1 })
    expect(item.slowestTopics).toEqual([{ topicId: 'roads_bikelanes', totalMs: 40 * 60 * 1000 }])
    expect(item).not.toHaveProperty('topics')
  })
})

describe('mapProcessingRunDetail', () => {
  it('parses topic durations, orphans, and afterthoughts', () => {
    const detail = mapProcessingRunDetail(baseRun)
    const roads = detail.topics.find((t) => t.topicId === 'roads_bikelanes')
    expect(roads).toMatchObject({
      status: 'completed',
      luaMs: 10 * 60 * 1000,
      sqlMs: 30 * 60 * 1000,
      totalMs: 40 * 60 * 1000,
    })
    expect(detail.orphanedTopics).toEqual([
      expect.objectContaining({ topicId: 'unknown_orphan', status: 'completed' }),
    ])
    expect(detail.afterthoughts).toEqual(
      expect.arrayContaining([
        { afterthoughtId: 'statistics', status: 'completed', durationMs: 60_000 },
        { afterthoughtId: 'campaign_counts', status: 'skipped', skipReason: 'unchanged' },
        { afterthoughtId: 'sidepath_export', status: 'not_recorded' },
      ]),
    )
  })

  it('filters to one topic when requested', () => {
    const detail = mapProcessingRunDetail(baseRun, 'parking')
    expect(detail.topics).toEqual([
      expect.objectContaining({ topicId: 'parking', status: 'skipped', skipReason: 'weekend' }),
    ])
    expect(detail.orphanedTopics).toEqual([])
  })
})
