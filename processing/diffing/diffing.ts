import { $, sql } from 'bun'
import chalk from 'chalk'
import type { Topic } from '../constants/topics.const'
import { isDev } from '../utils/isDev'
import { params } from '../utils/parameters'

const referenceTableIdentifier = (table: string) => `diffing_reference."${table}"` as const
const diffTableIdentifier = (table: string) => `public."${table}_diff"` as const
const tableIdentifier = (table: string) => `public."${table}"` as const

export async function getTopicTables(topic: Topic) {
  try {
    // Some tables don't follow the strict schema that is required for the diffing to work.
    // We need to skip those so nothing breaks.
    const ignoreTableNames = ['todos_lines', 'parking_errors']

    const tables = await $`lua /processing/utils/TableNames.lua ${topic}`.text().then(
      (tables) =>
        new Set(
          tables
            .split('\n')
            .filter((tName) => tName !== '')
            .filter((tName) => !ignoreTableNames.includes(tName)),
        ),
    )
    return tables
  } catch (error) {
    // @ts-expect-error error is unkown but we know it's likely a bun error here https://bun.sh/docs/runtime/shell#error-handling
    const msg = 'stderr' in error ? error.stderr.toString() : error
    throw new Error(
      `Failed to get tables for topic "${topic}". This is likely due to some required columns missing: ${msg}`,
    )
  }
}

export async function initializeDiffingReferenceSchema() {
  return sql`CREATE SCHEMA IF NOT EXISTS diffing_reference`
}

export async function initializeCustomFunctionDiffing() {
  await $`psql -q -f ./diffing/jsonb_diff.sql`
}

/**
 * Get all table names from the given schema.
 * @param schema
 * @returns a set of table names
 */
export async function getSchemaTables(schema: string) {
  const rows: { table_name: string }[] = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = ${schema}
    AND table_type = 'BASE TABLE'`
  return new Set(rows.map(({ table_name }) => table_name))
}

/**
 * Create reference table by copying it to the `diffing_reference` schema.
 * Only store data within the diffing bbox if provided, otherwise skip.
 * @returns the Promise of the query
 */
export async function createReferenceTable(table: string) {
  if (!params.diffingBbox) throw new Error('Required param `env.PROCESSING_DIFFING_BBOX` missing')

  const tableId = tableIdentifier(table)
  const referenceTableId = referenceTableIdentifier(table)
  await sql.unsafe(`DROP TABLE IF EXISTS ${referenceTableId}`)

  const [minLon, minLat, maxLon, maxLat] = params.diffingBbox

  await sql.unsafe(`
    CREATE TABLE ${referenceTableId} AS
    SELECT * FROM ${tableId}
    WHERE ST_Intersects(
      geom,
      ST_Transform(ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), ST_SRID(geom))
    )
  `)

  if (isDev) {
    console.log(
      'Diffing: Recreated reference table with bbox filter',
      JSON.stringify({ table, diffingBbox: params.diffingBbox }),
    )
  }
}

export async function dropDiffTable(table: string) {
  const diffTableId = diffTableIdentifier(table)
  return sql.unsafe(`DROP TABLE IF EXISTS ${diffTableId}`)
}

/**
 * Create a spatial index on the given table's `geom` column.
 * @returns the Promise of the query
 */
async function createSpatialIndex(table: string) {
  const tableId = diffTableIdentifier(table)
  return sql.unsafe(`CREATE INDEX ON ${tableId} USING GIST(geom)`)
}

/**
 * Diff the given table with the reference table and store the result in the `table_diff` table.
 * Only perform diffing if diffing bbox is provided, otherwise skip.
 * @param table
 * @returns the number of added, removed and modified entries
 */
export async function computeDiff(table: string) {
  if (!params.diffingBbox) throw new Error('Required param `env.PROCESSING_DIFFING_BBOX` missing')

  const tableId = tableIdentifier(table)
  const referenceTableId = referenceTableIdentifier(table)
  const diffTableId = diffTableIdentifier(table)
  const joinedTableId = `diffing_reference."${table}_joined"`
  const changeTypes = {
    added: `'{"CHANGE": "added"}'`,
    removed: `'{"CHANGE": "removed"}'`,
    modified: `'{"CHANGE": "modified"}'`,
  }

  // compute full outer join
  await sql.unsafe(`DROP TABLE IF EXISTS ${joinedTableId}`)

  const [minLon, minLat, maxLon, maxLat] = params.diffingBbox

  await sql.unsafe(`
    CREATE TABLE ${joinedTableId} AS
    SELECT
      ${tableId}.tags AS new_tags,
      ${tableId}.id AS new_id,
      ${tableId}.meta AS new_meta,
      ${tableId}.geom AS new_geom,
      ${referenceTableId}.tags AS old_tags,
      ${referenceTableId}.id AS old_id,
      ${referenceTableId}.meta AS old_meta,
      ${referenceTableId}.geom AS old_geom
    FROM ${referenceTableId}
    FULL OUTER JOIN ${tableId} ON ${referenceTableId}.id = ${tableId}.id
    WHERE
      ${tableId}.geom IS NULL
      OR ST_Intersects(
        ${tableId}.geom,
        ST_Transform(ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), ST_SRID(${tableId}.geom))
      )
  `)

  // create the diff table
  await dropDiffTable(table)
  await sql.unsafe(`
    CREATE TABLE ${diffTableId} AS
    SELECT id, tags, meta, geom FROM ${tableId}
    WITH NO DATA`)

  // compute diff
  const modifiedPromise = sql
    .unsafe(
      `INSERT INTO ${diffTableId} (id, tags, meta, geom)
      SELECT
        new_id AS id,
        jsonb_diff(old_tags, new_tags) || ${changeTypes.modified} AS tags,
        new_meta AS meta,
        new_geom AS geom
        FROM ${joinedTableId}
        WHERE new_id IS NOT NULL AND old_id IS NOT NULL AND old_tags <> new_tags
        RETURNING 1`,
    )
    .values()

  const addedPromise = sql
    .unsafe(
      `INSERT INTO ${diffTableId} (id, tags, meta, geom)
      SELECT
        new_id AS id,
        new_tags || ${changeTypes.added} AS tags,
        new_meta AS meta,
        new_geom AS geom
      FROM ${joinedTableId}
      WHERE old_id IS NULL
      RETURNING 1`,
    )
    .values()

  const removedPromise = sql
    .unsafe(
      `INSERT INTO ${diffTableId} (id, tags, meta, geom)
      SELECT
        old_id AS id,
        old_tags || ${changeTypes.removed} AS tags,
        old_meta AS meta,
        old_geom AS geom
      FROM ${joinedTableId}
      WHERE new_id IS NULL
      RETURNING 1`,
    )
    .values()

  return Promise.all([modifiedPromise, addedPromise, removedPromise]).then(
    async ([rawModified, rawAdded, rawRemoved]) => {
      const nModified = rawModified.length
      const nAdded = rawAdded.length
      const nRemoved = rawRemoved.length
      const nTotal = nModified + nAdded + nRemoved
      if (nTotal === 0) {
        await dropDiffTable(table)
      } else {
        createSpatialIndex(table)
      }
      await sql.unsafe(`DROP TABLE IF EXISTS ${joinedTableId}`)
      return {
        table,
        nTotal,
        nModified,
        nAdded,
        nRemoved,
      }
    },
  )
}

function printDiffInfo(diffInfo: Awaited<ReturnType<typeof computeDiff>>) {
  const { table } = diffInfo
  console.log(`🔍 Diffing table "${table}":`)
  const loggingStyle = [
    { name: 'total:', color: chalk.yellow, key: 'nTotal' as const },
    { name: 'added:', color: chalk.green, key: 'nAdded' as const },
    { name: 'removed:', color: chalk.red, key: 'nRemoved' as const },
    { name: 'modified:', color: chalk.blue, key: 'nModified' as const },
  ]
  const indent = ' '.repeat(5)
  loggingStyle.forEach(({ name, color, key }) => {
    console.log(`${indent}${name.padEnd(10)}${color(diffInfo[key])}`)
  })
}

/**
 * Diff the given tables and print the results.
 * Only performs diffing if diffing bbox is provided, otherwise skips diffing.
 * @param tables
 */
export async function diffTables(tables: string[]) {
  if (!params.diffingBbox) {
    console.log('Diffing: Skipping diffTables (no bbox provided)', JSON.stringify({ tables }))
    return
  }

  console.log('Diffing: diffTables', JSON.stringify({ tables, diffingBbox: params.diffingBbox }))

  // compute all diffs in parallel
  const diffResults = await Promise.all(tables.map((table) => computeDiff(table)))

  // print the results for each table that changed
  diffResults.filter(({ nTotal }) => nTotal > 0).map(printDiffInfo)
}
