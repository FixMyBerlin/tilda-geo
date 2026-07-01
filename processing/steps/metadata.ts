import { $, sql } from 'bun'
import type { AfterthoughtId } from '../constants/afterthoughts.const'
import { berlinTimeString } from '../utils/berlinTime'
import { type AfterthoughtEntry, type ProcessingAfterthoughtsMeta } from './afterthoughts/types'
import { originalFilePath } from './download'

/**
 * Create the metadata table in the database. If already exists, does nothing.
 * @returns the Promise of the query
 */
export async function initializeMetadataTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS public.meta (
      id SERIAL PRIMARY KEY,
      processing_duration TIME,
      osm_data_from TIMESTAMP,
      processing_started_at TIMESTAMP,
      processing_completed_at TIMESTAMP,
      qa_update_started_at TIMESTAMP,
      qa_update_completed_at TIMESTAMP,
      status VARCHAR(20) DEFAULT 'processed' CHECK (status IN ('processing', 'postprocessing', 'processed')),
      topics JSONB NOT NULL DEFAULT '{}',
      afterthoughts JSONB NOT NULL DEFAULT '{}'
    )`

  // Migration: Add async operation tracking columns, update status constraint, remove unused processed_at,
  // and add topics JSONB. This is a temporary migration that can be removed after deployment.
  // !! We will remove this section after 2026-04-01
  try {
    await sql`
      ALTER TABLE public.meta
        ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS qa_update_started_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS qa_update_completed_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS topics JSONB NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS afterthoughts JSONB NOT NULL DEFAULT '{}'
    `
    console.log(
      'Processing: Migration - Added async operation tracking, topics, and afterthoughts columns if they were missing',
    )

    // Statistics timing moved into the `afterthoughts` JSONB column; drop the old dedicated columns.
    // !! We will remove this section after 2026-10-01
    await sql`
      ALTER TABLE public.meta
        DROP COLUMN IF EXISTS statistics_started_at,
        DROP COLUMN IF EXISTS statistics_completed_at
    `
    console.log('Processing: Migration - Dropped unused statistics_started_at/completed_at columns')

    // Update status CHECK constraint to include 'postprocessing'
    await sql`ALTER TABLE public.meta DROP CONSTRAINT IF EXISTS meta_status_check`
    await sql`
      ALTER TABLE public.meta
        ADD CONSTRAINT meta_status_check
        CHECK (status IN ('processing', 'postprocessing', 'processed'))
    `
    console.log('Processing: Migration - Updated status constraint to include postprocessing')

    // Remove unused processed_at column (replaced by individual completion timestamps)
    await sql`ALTER TABLE public.meta DROP COLUMN IF EXISTS processed_at`
    console.log('Processing: Migration - Removed unused processed_at column')
  } catch (error) {
    // Columns or constraint might already exist, which is fine
    console.log(
      'Processing: Migration - Async operation columns or constraint already exists or migration failed:',
      error,
    )
  }

  return true
}

/**
 * Get the timestamp from the given OSM file. Uses osmium fileinfo to get the timestamp.
 * @param fileName the file name to take the timestamp from
 * @returns the time stamp as a string
 */
export async function getFileTimestamp(fileName: string) {
  const originalPath = originalFilePath(fileName)
  try {
    const timestamp = await $`osmium fileinfo ${originalPath} -g header.option.timestamp`.text()
    return timestamp.trim()
  } catch (error) {
    throw new Error(`Failed to get timestamp from file "${originalPath}": ${error}`)
  }
}

/**
 * Create a new processing entry at the start of processing.
 * @returns the ID of the created entry
 */
export async function createProcessingEntry() {
  const data = {
    processing_started_at: new Date(),
    status: 'processing',
  }

  console.log(
    'Processing:',
    'Creating processing entry',
    JSON.stringify({
      ...data,
      processing_started_at_localtime: berlinTimeString(data.processing_started_at),
    }),
  )

  const result = await sql`INSERT INTO public.meta ${sql(data)} RETURNING id`
  return result[0].id
}

/**
 * Update an existing processing entry with completion data.
 * @param processingId the ID of the processing entry to update
 * @param fileName the file that was used in this run
 * @param processingDurationMS the time the processing took in milliseconds
 * @returns the Promise of the query
 */
export async function updateProcessingEntry(
  processingId: number | null,
  sourceFileName: string,
  processingDurationMS: number,
) {
  if (!processingId) {
    console.error('[ERROR] Processing: Cannot update processing entry - no processingId available')
    return
  }
  const processingDuration = new Date(processingDurationMS).toISOString().slice(11, 19) // Extract HH:MM:SS from the ISO string

  const rawOsmTimestamp = await getFileTimestamp(sourceFileName)
  const osm_data_from = new Date(rawOsmTimestamp)
  if (Number.isNaN(osm_data_from.getTime())) {
    throw new Error(
      `Processing: Invalid OSM timestamp "${rawOsmTimestamp}" from source file "${sourceFileName}"`,
    )
  }

  const data = {
    processing_duration: processingDuration,
    osm_data_from,
    processing_completed_at: new Date(),
    status: 'postprocessing', // Main topics done; QA runs async; afterthoughts are debug-only
  }

  console.log(
    'Processing:',
    'Updating processing entry - main processing complete, async operations starting',
    JSON.stringify({
      id: processingId,
      ...data,
      osm_data_from_localtime: berlinTimeString(data.osm_data_from),
      processing_completed_at_localtime: berlinTimeString(data.processing_completed_at),
    }),
  )

  return sql`UPDATE public.meta SET ${sql(data)} WHERE id = ${processingId}`
}

/**
 * Record one afterthought result into public.meta.afterthoughts for the current run (merge + log).
 */
export async function recordAfterthought(
  processingId: number | null,
  afterthoughtId: AfterthoughtId,
  entry: AfterthoughtEntry,
) {
  if (!processingId) {
    console.error(
      '[ERROR] Processing: Cannot record afterthought metadata - no processingId available',
    )
    return
  }

  console.log(
    'Processing:',
    'Recording afterthought',
    JSON.stringify({ id: processingId, afterthoughtId, entry }),
  )

  const patch = { [afterthoughtId]: entry } satisfies ProcessingAfterthoughtsMeta
  await sql`
    UPDATE public.meta
    SET afterthoughts = COALESCE(afterthoughts, '{}'::jsonb) || ${patch}::jsonb
    WHERE id = ${processingId}
  `
}

export type TopicPhaseWindow = {
  start: string
  end: string
}

export type TopicSkipReason = 'weekend' | 'unchanged' | 'process_only_topics'

export type TopicRanEntry = {
  lua?: TopicPhaseWindow
  sql?: TopicPhaseWindow
  diff?: TopicPhaseWindow
}

export type TopicSkippedEntry = {
  skipped: TopicSkipReason
}

export type TopicTimingEntry = TopicRanEntry | TopicSkippedEntry

export type ProcessingTopicsMeta = Record<string, TopicTimingEntry>

export function toIsoWindow(start: Date, end: Date) {
  return { start: start.toISOString(), end: end.toISOString() } satisfies TopicPhaseWindow
}

/**
 * Persist per-topic timing JSON for the current processing run.
 */
export async function updateProcessingTopics(
  processingId: number | null,
  topics: ProcessingTopicsMeta,
) {
  if (!processingId) {
    console.error('[ERROR] Processing: Cannot update topics metadata - no processingId available')
    return
  }

  console.log(
    'Processing:',
    'Updating topic timings',
    JSON.stringify({ id: processingId, topicCount: Object.keys(topics).length }),
  )

  // Pass the object directly — Bun.SQL serializes it as jsonb. JSON.stringify double-encodes.
  return sql`UPDATE public.meta SET topics = ${topics} WHERE id = ${processingId}`
}
