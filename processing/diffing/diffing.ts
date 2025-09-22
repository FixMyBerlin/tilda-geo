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

    // HACK: Add all tables that start with _parking for diffing
    // This is a temporary solution to include parking-related tables that are normally excluded
    // because they start with underscore (which are filtered out in TableNames.lua)
    if (topic === 'parking') {
      const allTables = await getSchemaTables('public')
      const parkingTableNames = [...allTables].filter((tableName) =>
        tableName.startsWith('_parking'),
      )

      // Process tables: either use directly if they conform, or create adapter views
      const validParkingTables = new Set<string>()
      const adapterViews = new Set<string>()

      for (const tableName of parkingTableNames) {
        if (await hasRequiredColumnsForDiffing(tableName)) {
          // Table has all required columns, use directly
          validParkingTables.add(tableName)
        } else {
          // Table is missing some columns, create an adapter view
          const existingColumns = await getExistingColumns(tableName)
          if (existingColumns.length > 0) {
            try {
              const adapterViewName = await createSchemaAdapterView(tableName, existingColumns)
              validParkingTables.add(adapterViewName)
              adapterViews.add(adapterViewName)

              if (isDev) {
                console.log(`Diffing: Created adapter for ${tableName} -> ${adapterViewName}`)
              }
            } catch (error) {
              if (isDev) {
                console.warn(`Diffing: Failed to create adapter for ${tableName}:`, error)
              }
            }
          } else if (isDev) {
            console.warn(`Diffing: Skipping _parking table ${tableName} - no compatible columns`)
          }
        }
      }

      // Merge the valid parking tables with the existing tables
      validParkingTables.forEach((table) => tables.add(table))

      if (isDev && validParkingTables.size > 0) {
        console.log('Diffing: Added _parking tables to diffing', Array.from(validParkingTables))
        if (adapterViews.size > 0) {
          console.log('Diffing: Created adapter views', Array.from(adapterViews))
        }
      }
    }

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

/**
 * Clean up any existing adapter views that might interfere with processing.
 * This should be called before processing starts to avoid dependency conflicts.
 */
export async function cleanupAdapterViews() {
  try {
    // Find all adapter views that might exist
    const rows: { table_name: string }[] = await sql`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      AND table_name LIKE '%_diffing_adapter'
    `

    if (rows.length > 0) {
      const viewNames = rows.map((row) => row.table_name)
      if (isDev) {
        console.log('Diffing: Cleaning up existing adapter views', viewNames)
      }

      // Drop all adapter views with CASCADE to handle any dependencies
      for (const viewName of viewNames) {
        try {
          await sql.unsafe(`DROP VIEW IF EXISTS public."${viewName}" CASCADE`)
        } catch (error) {
          if (isDev) {
            console.warn(`Diffing: Failed to drop view ${viewName}:`, error)
          }
        }
      }
    }
  } catch (error) {
    if (isDev) {
      console.warn('Diffing: Failed to cleanup adapter views:', error)
    }
  }
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
 * Check if a table has the required columns for diffing.
 * @param tableName
 * @returns true if the table has all required columns
 */
async function hasRequiredColumnsForDiffing(tableName: string): Promise<boolean> {
  try {
    const rows: { column_name: string }[] = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
      AND column_name IN ('id', 'tags', 'meta', 'geom')
    `
    return rows.length === 4
  } catch (error) {
    if (isDev) {
      console.warn(`Diffing: Failed to check columns for table ${tableName}:`, error)
    }
    return false
  }
}

/**
 * Get the columns that a table has from the required set.
 * @param tableName
 * @returns array of column names that exist
 */
async function getExistingColumns(tableName: string): Promise<string[]> {
  try {
    const rows: { column_name: string }[] = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
      AND column_name IN ('id', 'tags', 'meta', 'geom')
      ORDER BY column_name
    `
    return rows.map((row) => row.column_name)
  } catch (error) {
    if (isDev) {
      console.warn(`Diffing: Failed to get columns for table ${tableName}:`, error)
    }
    return []
  }
}

/**
 * Create a temporary view that adapts a table to the diffing schema.
 * @param tableName
 * @param existingColumns
 * @returns the name of the created view
 */
async function createSchemaAdapterView(
  tableName: string,
  existingColumns: string[],
): Promise<string> {
  const viewName = `${tableName}_diffing_adapter`

  // Build the SELECT clause with defaults for missing columns
  const selectParts: string[] = []

  if (existingColumns.includes('id')) {
    selectParts.push('id')
  } else {
    selectParts.push(`'${tableName}_' || row_number() OVER() AS id`)
  }

  if (existingColumns.includes('tags')) {
    selectParts.push('tags')
  } else {
    selectParts.push("'{}'::jsonb AS tags")
  }

  if (existingColumns.includes('meta')) {
    selectParts.push('meta')
  } else {
    selectParts.push("'{}'::jsonb AS meta")
  }

  if (existingColumns.includes('geom')) {
    selectParts.push('geom')
  } else {
    selectParts.push('NULL::geometry AS geom')
  }

  const createViewSQL = `
    CREATE OR REPLACE VIEW public."${viewName}" AS
    SELECT ${selectParts.join(', ')}
    FROM public."${tableName}"
  `

  await sql.unsafe(createViewSQL)

  if (isDev) {
    console.log(`Diffing: Created schema adapter view ${viewName} for table ${tableName}`)
  }

  return viewName
}

/**
 * Drop a temporary view created for schema adaptation.
 * @param viewName
 */
async function dropSchemaAdapterView(viewName: string): Promise<void> {
  try {
    // Try normal drop first
    await sql.unsafe(`DROP VIEW IF EXISTS public."${viewName}"`)
  } catch (error) {
    try {
      // If that fails, try with CASCADE to handle dependencies
      await sql.unsafe(`DROP VIEW IF EXISTS public."${viewName}" CASCADE`)
    } catch (cascadeError) {
      if (isDev) {
        console.warn(`Diffing: Failed to drop view ${viewName} even with CASCADE:`, cascadeError)
      }
    }
  }
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

  // Clean up any adapter views that were created
  const adapterViews = tables.filter((table) => table.includes('_diffing_adapter'))
  if (adapterViews.length > 0) {
    if (isDev) {
      console.log('Diffing: Cleaning up adapter views', adapterViews)
    }
    await Promise.all(adapterViews.map(dropSchemaAdapterView))
  }
}
