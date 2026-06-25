import { TZDate } from '@date-fns/tz'
import { getDay, subDays } from 'date-fns'
import {
  topicIds,
  topicScheduleById,
  type TopicId,
} from '../../src/data/processingTypes/topicId.generated.const'
import db from '../../src/server/db.server'

type TopicPhaseWindow = {
  start: string
  end: string
}

type TopicRanEntry = {
  lua?: TopicPhaseWindow
  sql?: TopicPhaseWindow
  diff?: TopicPhaseWindow
}

type TopicSkippedEntry = {
  skipped: 'weekend' | 'unchanged' | 'process_only_topics'
}

type ProcessingTopicsMeta = Record<string, TopicRanEntry | TopicSkippedEntry>

const RUN_DAYS = 15

/** Rough per-topic durations for plausible admin chart seed data (ms). */
const topicDurationsMs = {
  roads_bikelanes: { lua: 50 * 60_000, sql: 12 * 60_000, diff: 8 * 60_000 },
  bikeroutes: { lua: 8 * 60_000, sql: 3 * 60_000, diff: 2 * 60_000 },
  bicycleParking: { lua: 6 * 60_000, sql: 2 * 60_000, diff: 60_000 },
  trafficSigns: { lua: 10 * 60_000, sql: 4 * 60_000, diff: 2 * 60_000 },
  boundaries: { lua: 5 * 60_000, sql: 2 * 60_000, diff: 60_000 },
  places: { lua: 8 * 60_000, sql: 3 * 60_000, diff: 2 * 60_000 },
  publicTransport: { lua: 12 * 60_000, sql: 5 * 60_000, diff: 3 * 60_000 },
  poiClassification: { lua: 15 * 60_000, sql: 6 * 60_000, diff: 3 * 60_000 },
  barriers: { lua: 7 * 60_000, sql: 2 * 60_000, diff: 60_000 },
  landcover: { lua: 120 * 60_000, sql: 35 * 60_000, diff: 20 * 60_000 },
  parking: { lua: 25 * 60_000, sql: 8 * 60_000, diff: 4 * 60_000 },
} as const satisfies Record<TopicId, { lua: number; sql: number; diff: number }>

const unchangedSkipTopics = [
  'bikeroutes',
  'places',
  'barriers',
] as const satisfies readonly TopicId[]

const durationJitter = (baseMs: number, dayIndex: number, topicId: TopicId) => {
  const factor = 0.88 + ((dayIndex * 17 + topicId.length * 13) % 25) / 100
  return Math.round(baseMs * factor)
}

const msToTimeString = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

const isBerlinSaturday = (date: Date) => {
  const day = getDay(new TZDate(date, 'Europe/Berlin'))
  return day === 6
}

const berlinNightlyRunStart = (daysAgo: number) => {
  const berlinDate = new TZDate(subDays(new Date(), daysAgo), 'Europe/Berlin')
  berlinDate.setHours(2, 15, 0, 0)
  return new Date(berlinDate.getTime())
}

const toIsoWindow = (startMs: number, endMs: number) => ({
  start: new Date(startMs).toISOString(),
  end: new Date(endMs).toISOString(),
})

const buildTopicsForRun = (runStart: Date, dayIndex: number) => {
  const topics: ProcessingTopicsMeta = {}
  const saturdayRun = isBerlinSaturday(runStart)
  let cursorMs = runStart.getTime()

  for (const topicId of topicIds) {
    if (topicScheduleById[topicId] === 'weekend' && !saturdayRun) {
      topics[topicId] = { skipped: 'weekend' }
      continue
    }

    if (dayIndex % 4 === 2 && unchangedSkipTopics.includes(topicId)) {
      topics[topicId] = { skipped: 'unchanged' }
      continue
    }

    const durations = topicDurationsMs[topicId]
    const luaMs = durationJitter(durations.lua, dayIndex, topicId)
    const sqlMs = durationJitter(durations.sql, dayIndex, topicId)
    const diffMs = durationJitter(durations.diff, dayIndex, topicId)

    const luaStartMs = cursorMs
    const luaEndMs = luaStartMs + luaMs
    const sqlEndMs = luaEndMs + sqlMs
    const diffEndMs = sqlEndMs + diffMs
    cursorMs = diffEndMs

    topics[topicId] = {
      lua: toIsoWindow(luaStartMs, luaEndMs),
      sql: toIsoWindow(luaEndMs, sqlEndMs),
      diff: toIsoWindow(sqlEndMs, diffEndMs),
    }
  }

  return { topics, processingDurationMs: cursorMs - runStart.getTime() }
}

const ensureMetaTable = async () => {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.meta (
      id SERIAL PRIMARY KEY,
      processing_duration TIME,
      osm_data_from TIMESTAMP,
      processing_started_at TIMESTAMP,
      processing_completed_at TIMESTAMP,
      qa_update_started_at TIMESTAMP,
      qa_update_completed_at TIMESTAMP,
      statistics_started_at TIMESTAMP,
      statistics_completed_at TIMESTAMP,
      status VARCHAR(20) DEFAULT 'processed' CHECK (status IN ('processing', 'postprocessing', 'processed')),
      topics JSONB NOT NULL DEFAULT '{}'
    )
  `)

  await db.$executeRawUnsafe(`
    ALTER TABLE public.meta
      ADD COLUMN IF NOT EXISTS topics JSONB NOT NULL DEFAULT '{}'
  `)
}

const seedProcessingMeta = async () => {
  await ensureMetaTable()
  await db.$executeRawUnsafe(`TRUNCATE public.meta RESTART IDENTITY`)

  for (let dayIndex = RUN_DAYS - 1; dayIndex >= 0; dayIndex -= 1) {
    const daysAgo = dayIndex
    const processingStartedAt = berlinNightlyRunStart(daysAgo)
    const { topics, processingDurationMs } = buildTopicsForRun(processingStartedAt, dayIndex)

    const processingCompletedAt = new Date(processingStartedAt.getTime() + processingDurationMs)
    const qaUpdateStartedAt = new Date(processingCompletedAt.getTime() + 60_000)
    const qaUpdateCompletedAt = new Date(
      qaUpdateStartedAt.getTime() + (5 + (dayIndex % 4)) * 60_000,
    )
    const statisticsStartedAt = new Date(qaUpdateCompletedAt.getTime() + 30_000)
    const statisticsCompletedAt = new Date(
      statisticsStartedAt.getTime() + (3 + (dayIndex % 3)) * 60_000,
    )

    const osmDataFrom = new TZDate(subDays(processingStartedAt, 2), 'Europe/Berlin')
    osmDataFrom.setHours(12, 0, 0, 0)

    await db.$executeRaw`
      INSERT INTO public.meta (
        processing_duration,
        osm_data_from,
        processing_started_at,
        processing_completed_at,
        qa_update_started_at,
        qa_update_completed_at,
        statistics_started_at,
        statistics_completed_at,
        status,
        topics
      ) VALUES (
        ${msToTimeString(processingDurationMs)}::time,
        ${new Date(osmDataFrom.getTime())},
        ${processingStartedAt},
        ${processingCompletedAt},
        ${qaUpdateStartedAt},
        ${qaUpdateCompletedAt},
        ${statisticsStartedAt},
        ${statisticsCompletedAt},
        'processed',
        ${JSON.stringify(topics)}::jsonb
      )
    `
  }

  console.log(`✅ Seeded ${RUN_DAYS} processing meta runs (daily + Saturday landcover timings)`)
}

export default seedProcessingMeta
