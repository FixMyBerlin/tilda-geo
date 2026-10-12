import db from '@/server/db.server'
import type {
  QaIndicatorTableRow,
  QaLatestEvaluationRow,
} from '@/server/qa-configs/evaluation/planQaEvaluationCreates'
import type { QaLastEditor } from '@/server/qa-configs/evaluation/qaEvaluationRules'
import {
  getQaIndicatorsTableName,
  getQaLastEditorsTableName,
} from '@/server/qa-configs/utils/getQaTableName'

/** True when `tableName` (schema-qualified or on the search path) exists in the database. */
async function tableExists(tableName: string) {
  const [{ reg } = { reg: null }] = await db.$queryRawUnsafe<Array<{ reg: string | null }>>(
    'SELECT to_regclass($1)::text AS reg',
    tableName,
  )
  return reg !== null
}

/**
 * All `<map>_indicators` rows of a config, or of one cell when `areaId` is given. One query either
 * way — cells can hold thousands of rows, so nothing here may run per cell.
 * A missing table (processing has not written it yet) is not an error and yields no rows. Logged
 * once per call.
 */
export async function selectQaIndicatorTableRows(input: { mapTable: string; areaId?: string }) {
  const tableName = getQaIndicatorsTableName(input.mapTable)
  const params = input.areaId === undefined ? [] : [input.areaId]

  if (!(await tableExists(tableName))) {
    console.warn(`QA: ${tableName} does not exist, treating every cell as without indicator rows`)
    return []
  }

  return db.$queryRawUnsafe<QaIndicatorTableRow[]>(
    `
      SELECT
        area_id AS "areaId",
        indicator_key AS "indicatorKey",
        reference::float,
        current::float,
        difference::float,
        deviation::float,
        breakdown
      FROM ${tableName}
      ${input.areaId === undefined ? '' : 'WHERE area_id = $1'}
    `,
    ...params,
  )
}

/**
 * Latest `QaEvaluation` per (config, area, indicator). `createdAt DESC, id DESC` — both columns,
 * always: rows written by one nightly run share a timestamp, so the id breaks the tie.
 */
export async function selectQaLatestEvaluationRows(input: { configId: number; areaId?: string }) {
  const params: unknown[] = [input.configId]
  let areaFilterSql = ''
  if (input.areaId !== undefined) {
    params.push(input.areaId)
    areaFilterSql = `AND e."areaId" = $${params.length}`
  }

  return db.$queryRawUnsafe<QaLatestEvaluationRow[]>(
    `
      SELECT DISTINCT ON (e."areaId", e."indicatorKey")
             e."areaId", e."indicatorKey", e."systemStatus", e."userStatus"
      FROM prisma."QaEvaluation" e
      WHERE e."configId" = $1 ${areaFilterSql}
      ORDER BY e."areaId", e."indicatorKey", e."createdAt" DESC, e.id DESC
    `,
    ...params,
  )
}

/**
 * `<map>_last_editors` of a config (or one cell) as `areaId → editors`. One query per config.
 * A missing table (processing has not run with the trusted-editor step yet) is not an error: every
 * cell then has no editors, so no indicator becomes TRUSTED_EDITOR_CHANGE. Logged once per call.
 */
export async function selectQaLastEditorsByAreaId(input: { mapTable: string; areaId?: string }) {
  const tableName = getQaLastEditorsTableName(input.mapTable)
  const params = input.areaId === undefined ? [] : [input.areaId]

  if (!(await tableExists(tableName))) {
    console.warn(`QA: ${tableName} does not exist, treating every cell as without editors`)
    return new Map<string, QaLastEditor[]>()
  }

  const rows = await db.$queryRawUnsafe<Array<{ areaId: string; lastEditors: QaLastEditor[] }>>(
    `
      SELECT area_id AS "areaId", last_editors AS "lastEditors"
      FROM ${tableName}
      ${input.areaId === undefined ? '' : 'WHERE area_id = $1'}
    `,
    ...params,
  )

  // `updatedAt` is BIGINT epoch seconds inside JSONB, which arrives as a JS number already.
  return new Map(rows.map((row) => [row.areaId, row.lastEditors ?? []]))
}
