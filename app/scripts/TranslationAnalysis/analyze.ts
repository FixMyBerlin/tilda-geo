import { sql } from 'bun'
import fs from 'fs'
import path from 'path'
import { translations } from '../../src/app/regionen/[regionSlug]/_components/SidebarInspector/TagsTable/translations/translations.const'
import { interactivityConfiguration } from '../../src/app/regionen/[regionSlug]/_mapData/mapDataSources/generalization/interacitvityConfiguartion'

// Use GEO_DATABASE_URL instead of DATABASE_URL to avoid Prisma-specific parameters
// Clean the URL to remove parameters that bun doesn't understand
const cleanDatabaseUrl = (url: string) => {
  return url
    .replace('?schema=prisma', '')
    .replace('?pool_timeout=0', '')
    .replace('&pool_timeout=0', '')
    .replace('&schema=prisma', '')
}

const DATABASE_URL =
  cleanDatabaseUrl(process.env.GEO_DATABASE_URL || '') ||
  cleanDatabaseUrl(process.env.DATABASE_URL || '') ||
  ''

// Set the database URL for bun's sql template literal
if (DATABASE_URL) {
  // @ts-expect-error it seems to work and this script is not that important…
  process.env.DATABASE_URL = DATABASE_URL
}

// Keys that should be skipped (full text, special handling, numbers)
const SKIP_KEYS = [
  'note',
  'description',
  'traffic_sign',
  'traffic_sign:forward',
  'traffic_sign:backward',
  'name',
  'highway_name',
  'highway:name',
  'maxstay:conditional',
  'operator',
  'website',
  'cycle_network_key',
  'route_description',
  'symbol_description',
  'colours',
  'colour',
  'ref',
  'capacity',
  'capacity:cargo_bike',
  'capacity:disabled',
  'highway_width_proc_effective',
  'length',
  'maxspeed',
  'maxheight',
  'population',
  'width',
  'sum_km',
  'lane_km',
  'd_other_km',
  'on_kerb_km',
  'half_on_kerb_km',
  'street_side_km',
  'length_wo_dual_carriageway',
  'done_percent',
  'admin_level',
  'maxstay',
  'parking:levels',
  'distance',
  'buffer_left',
  'buffer_right',
  'tilda_osm_id',
  'tilda_width',
  'population:date',
  'area',
  'circumference',
  'regionalschluessel',
  'street:name',
  'buffer_radius',
  'addr_zip',
  'addr_city',
  'addr_number',
  'addr_street',
  'direction',
  'radius',
]

// Number keys that are handled as units
const NUMBER_KEYS = [
  'capacity',
  'capacity:cargo_bike',
  'capacity:disabled',
  'highway_width_proc_effective',
  'length',
  'maxspeed',
  'maxheight',
  'population',
  'width',
  'sum_km',
  'lane_km',
  'd_other_km',
  'on_kerb_km',
  'half_on_kerb_km',
  'street_side_km',
  'length_wo_dual_carriageway',
  'done_percent',
  'admin_level',
  'maxstay',
  'parking:levels',
  'distance',
  'buffer_left',
  'buffer_right',
  'tilda_width',
  'area',
  'circumference',
  'buffer_radius',
  'direction',
  'radius',
]

interface AnalysisResult {
  tableName: string
  keysPresent: string[]
  keysMissing: string[]
  keyValuesPresent: Record<string, string[]>
  keyValuesMissing: Record<string, string[]>
}

async function analyzeTable(tableName: string): Promise<AnalysisResult> {
  const tableConfig =
    interactivityConfiguration[tableName as keyof typeof interactivityConfiguration]
  if (!tableConfig) {
    throw new Error(`Table ${tableName} not found in interactivityConfiguration`)
  }

  // Get all keys from the database
  let allKeys: string[] = []
  try {
    // Use sql.unsafe for dynamic table names
    const result = await sql.unsafe(`
      SELECT DISTINCT jsonb_object_keys(tags) as key
      FROM "${tableName}"
      WHERE tags IS NOT NULL
      AND jsonb_typeof(tags) = 'object'
    `)
    allKeys = result.map((row) => row.key).filter(Boolean)
  } catch (error) {
    console.warn(`Could not query keys from ${tableName}:`, error)
    // Fallback to styling keys if database query fails
    allKeys = tableConfig.stylingKeys
  }

  const keysPresent: string[] = []
  const keysMissing: string[] = []
  const keyValuesPresent: Record<string, string[]> = {}
  const keyValuesMissing: Record<string, string[]> = {}

  // Get actual key-values from database
  const keyValuesFromDb: Record<string, Set<string>> = {}

  for (const key of allKeys) {
    // Skip osm_* keys entirely (debugging keys)
    if (key.startsWith('osm_')) {
      continue
    }

    if (SKIP_KEYS.includes(key)) {
      continue
    }

    // Check if key exists in translations (try both direct and atlas_ prefixed versions)
    const keyTranslationKey = `${tableName}--${key}--key`
    const atlasKeyTranslationKey = `atlas_${tableName}--${key}--key`
    if (translations[keyTranslationKey] || translations[atlasKeyTranslationKey]) {
      keysPresent.push(key)
    } else {
      keysMissing.push(key)
    }

    // Get actual values from database
    try {
      const result = await sql.unsafe(`
        SELECT DISTINCT tags->>'${key}' as value
        FROM "${tableName}"
        WHERE tags->>'${key}' IS NOT NULL
        AND tags->>'${key}' != ''
        LIMIT 100
      `)

      const values = result.map((row) => row.value).filter(Boolean)
      keyValuesFromDb[key] = new Set(values)
    } catch (error) {
      console.warn(`Could not query ${tableName}.${key}:`, error)
      keyValuesFromDb[key] = new Set()
    }
  }

  // Analyze key-values
  for (const [key, values] of Object.entries(keyValuesFromDb)) {
    if (SKIP_KEYS.includes(key) || NUMBER_KEYS.includes(key)) {
      continue
    }

    const presentValues: string[] = []
    const missingValues: string[] = []

    for (const value of values) {
      const translationKey = `${tableName}--${key}=${value}`
      const atlasTranslationKey = `atlas_${tableName}--${key}=${value}`
      if (translations[translationKey] || translations[atlasTranslationKey]) {
        presentValues.push(value)
      } else {
        missingValues.push(value)
      }
    }

    if (presentValues.length > 0) {
      keyValuesPresent[key] = presentValues
    }
    if (missingValues.length > 0) {
      keyValuesMissing[key] = missingValues
    }
  }

  return {
    tableName,
    keysPresent,
    keysMissing,
    keyValuesPresent,
    keyValuesMissing,
  }
}

function formatMissingKeys(tableName: string, keys: string[]): string {
  return keys.map((key) => `"${tableName}--${key}--key": ""`).join(',\n')
}

function formatMissingKeyValues(tableName: string, keyValues: Record<string, string[]>): string {
  const result: string[] = []

  Object.entries(keyValues).forEach(([key, values]) => {
    if (values.length > 0) {
      values.forEach((value) => {
        result.push(`"${tableName}--${key}=${value}": ""`)
      })
    }
  })

  return result.join(',\n')
}

function generateReport(results: AnalysisResult[]): void {
  const outputDir = path.join(__dirname, 'reports')

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Generate individual reports for each table
  results.forEach((result) => {
    const reportPath = path.join(outputDir, `${result.tableName}.md`)

    const report = `# Translation Analysis for ${result.tableName}

## Keys Present (${result.keysPresent.length})
${result.keysPresent.map((key) => `- ${key}`).join('\n')}

## Keys Missing (${result.keysMissing.length})
\`\`\`
${formatMissingKeys(result.tableName, result.keysMissing)}
\`\`\`

## Key-Values Present
${Object.entries(result.keyValuesPresent)
  .flatMap(([_, values]) => values.map((value) => `- ${value}`))
  .join('\n')}

## Key-Values Missing
\`\`\`
${formatMissingKeyValues(result.tableName, result.keyValuesMissing)}
\`\`\`
`

    fs.writeFileSync(reportPath, report)
    console.log(`Generated report for ${result.tableName}: ${reportPath}`)
  })
}

async function main() {
  console.log('Starting translation analysis...')

  const tableNames = Object.keys(interactivityConfiguration)
  const results: AnalysisResult[] = []

  for (const tableName of tableNames) {
    try {
      const result = await analyzeTable(tableName)
      results.push(result)
      console.log(
        `Analyzed ${tableName}: ${result.keysMissing.length} missing keys, ${Object.values(result.keyValuesMissing).reduce((sum, v) => sum + v.length, 0)} missing key-values`,
      )
    } catch (error) {
      console.error(`Error analyzing ${tableName}:`, error)
    }
  }

  generateReport(results)
  console.log('Analysis complete!')
}

if (require.main === module) {
  main().catch(console.error)
}
