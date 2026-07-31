import { $, sql } from 'bun'
import type { Topic } from '../../constants/topics.const'
import { logEnd, logStart } from '../../utils/logging'
import { toIsoWindow } from '../metadata'
import { afterthoughtSkipped } from './types'

const LOG_PREFIX = '[Afterthoughts][CampaignCounts]'

type CampaignCountsByState = { id: string; name: string; count: number }

type CampaignCountEntry = { total: number; byState: CampaignCountsByState[] }

type CampaignCountsSnapshot = Record<string, CampaignCountEntry>

type TotalCountRow = { todo_id: string; count: number }
type BundeslandCountRow = {
  bundesland_id: string
  bundesland_name: string
  todo_id: string
  count: number
}

async function getTodoIds() {
  const rawRoadTodos = await $`lua /processing/utils/types/extract_road_todos.lua`.text()
  const rawBikelaneTodos = await $`lua /processing/utils/types/extract_bikelane_todos.lua`.text()
  const parseLines = (raw: string) =>
    raw
      .split('\n')
      .filter(Boolean)
      .map((line) => line.split(';')[0])
      .filter((id): id is string => Boolean(id))

  return [...new Set([...parseLines(rawRoadTodos), ...parseLines(rawBikelaneTodos)])]
}

async function ensureCampaignStatsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS public.todos_lines_campaign_stats (
      processing_id INTEGER PRIMARY KEY,
      osm_data_from TIMESTAMP,
      stats JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
}

async function upsertCampaignStats(
  processingId: number,
  osmDataFrom: Date,
  stats: CampaignCountsSnapshot,
) {
  await ensureCampaignStatsTable()
  await sql`
    INSERT INTO public.todos_lines_campaign_stats (processing_id, osm_data_from, stats)
    VALUES (${processingId}, ${osmDataFrom}, ${stats})
    ON CONFLICT (processing_id) DO UPDATE SET
      osm_data_from = EXCLUDED.osm_data_from,
      stats = EXCLUDED.stats,
      created_at = NOW()
  `
}

/**
 * Afterthought: precompute per-campaign todo counts into public.todos_lines_campaign_stats.
 * Replaces 68 per-campaign API queries with two set-based queries at processing time.
 */
export async function computeCampaignCounts(processingId: number | null, ranTopics: Set<Topic>) {
  if (!ranTopics.has('roads_bikelanes')) {
    console.log(`${LOG_PREFIX} ⏩ Skipping — roads_bikelanes did not run this cycle.`)
    return afterthoughtSkipped('roads_bikelanes_skipped')
  }

  if (!processingId) {
    console.error(`${LOG_PREFIX} ⏩ Skipping — no processingId available.`)
    return afterthoughtSkipped('failed')
  }

  const [
    { todos_lines_exists, boundaries_exists } = {
      todos_lines_exists: false,
      boundaries_exists: false,
    },
  ] = await sql`
      SELECT
        to_regclass('public.todos_lines') IS NOT NULL AS todos_lines_exists,
        to_regclass('public.boundaries') IS NOT NULL AS boundaries_exists
    `

  if (!todos_lines_exists || !boundaries_exists) {
    console.warn(
      `${LOG_PREFIX} ⏩ Skipping — required tables missing.`,
      JSON.stringify({ todos_lines_exists, boundaries_exists }),
    )
    return afterthoughtSkipped('missing_tables')
  }

  const start = new Date()

  try {
    logStart('Afterthoughts: Campaign counts')
    const todoIds = await getTodoIds()

    const totalRows = await sql<TotalCountRow[]>`
      SELECT k.key AS todo_id, COUNT(DISTINCT t.osm_id)::int AS count
      FROM public.todos_lines t, LATERAL jsonb_object_keys(t.tags) AS k(key)
      WHERE k.key = ANY(${todoIds})
      GROUP BY k.key
    `

    const bundeslandRows = await sql<BundeslandCountRow[]>`
      SELECT
        b.id::text AS bundesland_id,
        b.tags->>'name' AS bundesland_name,
        k.key AS todo_id,
        COUNT(DISTINCT t.osm_id)::int AS count
      FROM public.boundaries b
      JOIN public.todos_lines t ON ST_Intersects(t.geom, b.geom)
      CROSS JOIN LATERAL jsonb_object_keys(t.tags) AS k(key)
      WHERE b.tags->>'admin_level' = '4'
        AND k.key = ANY(${todoIds})
      GROUP BY b.id, b.tags->>'name', k.key
    `

    const snapshot: CampaignCountsSnapshot = {}
    for (const { todo_id, count } of totalRows) {
      snapshot[todo_id] = { total: count, byState: [] }
    }
    for (const { bundesland_id, bundesland_name, todo_id, count } of bundeslandRows) {
      const entry: CampaignCountEntry = snapshot[todo_id] ?? { total: 0, byState: [] }
      entry.byState.push({ id: bundesland_id, name: bundesland_name ?? '', count })
      snapshot[todo_id] = entry
    }

    const [metaRow] = await sql<{ osm_data_from: Date | null }[]>`
      SELECT osm_data_from FROM public.meta WHERE id = ${processingId}
    `
    const osmDataFrom = metaRow?.osm_data_from
    if (!osmDataFrom) {
      console.warn(`${LOG_PREFIX} WARN: osm_data_from missing on meta row — skipping persist.`)
      return afterthoughtSkipped('failed')
    }

    console.log(
      'Processing:',
      'Updating campaign counts',
      JSON.stringify({ id: processingId, campaignCount: Object.keys(snapshot).length }),
    )
    await upsertCampaignStats(processingId, osmDataFrom, snapshot)
    logEnd('Afterthoughts: Campaign counts')
    return toIsoWindow(start, new Date())
  } catch (error) {
    console.warn(`${LOG_PREFIX} WARN: campaign counts failed — continuing.`, error)
    return afterthoughtSkipped('failed')
  }
}
