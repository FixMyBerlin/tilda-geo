#!/usr/bin/env bun
import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { Client } from 'pg'
import { z } from 'zod'
import { getExportAttributeType } from '../../src/server/api/export/exportAttributeType'
import { getBaseDatabaseUrl } from '../../src/server/database-url.server'
import {
  ALLOWED_SOURCES,
  getRemoteDatabaseUrl,
  looksLikeConnectionError,
} from '../db-pull/db-helpers'

type CompiledValue = {
  value: string
  children?: Array<CompiledValue>
}

type CompiledAttribute = {
  key: string
  type: 'string' | 'number' | 'sanitized_strings' | 'ignore'
  values?: Array<CompiledValue>
}

type CompiledTopicDoc = {
  tableName: string
  sourceIds: Array<string>
  title?: string
  attributes: Array<CompiledAttribute>
}

type DbPair = {
  key: string
  value: string
}

// Static `import x from '…gen.json'` can be cached by Bun across runs, so right after
// `topic-docs-build` rewrites these files the coverage script could still compare the DB
// against an older in-memory snapshot. Reading from disk each process start avoids that.
const loadJson = <T>(relativePath: string) => {
  const absolutePath = path.resolve(import.meta.dir, relativePath)
  return JSON.parse(readFileSync(absolutePath, 'utf-8')) as T
}

const docsByTable = loadJson<Record<string, CompiledTopicDoc>>(
  '../../src/data/generated/topicDocs/byTableName/index.gen.json',
)
const translationMap = loadJson<Record<string, string>>(
  '../../src/data/generated/topicDocs/inspector/translations.gen.json',
)

const translationsConstDir = path.resolve(
  import.meta.dir,
  '../../src/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations',
)

/**
 * Manual modules checked against topic-docs YAML (same merge order as `translations.const.ts` before
 * generated JSON). Omits `translationsParkingLars` (external), generated JSON, and
 * `translationsAtlasAndAll` (atlas + broad `ALL--` fallbacks — not topic-docs–owned; would false-fail
 * against parking YAML wording).
 */
const TRANSLATION_CONST_MODULES: Array<{ file: string; exportName: string }> = [
  { file: 'translationsOneway.const.ts', exportName: 'translationsOneway' },
  {
    file: 'translationsSeparationTrafficModeMarking.const.ts',
    exportName: 'translationsSeparationTrafficModeMarking',
  },
  { file: 'translationsWdith.const.ts', exportName: 'translationsWdith' },
]

const collectTopicDocsSourceIds = (docs: Record<string, CompiledTopicDoc>) => {
  const ids = new Set<string>()
  for (const doc of Object.values(docs)) {
    for (const sourceId of doc.sourceIds) {
      ids.add(sourceId)
    }
  }
  return ids
}

const buildExpectedFromYaml = (input: {
  genTranslations: Record<string, string>
  docs: Record<string, CompiledTopicDoc>
}) => {
  const expected = { ...input.genTranslations }
  for (const doc of Object.values(input.docs)) {
    if (doc.title === undefined) continue
    for (const sourceId of doc.sourceIds) {
      expected[`${sourceId}--title`] = doc.title
    }
  }
  return expected
}

const sourcePrefixBeforeDoubleDash = (translationKey: string) => {
  const idx = translationKey.indexOf('--')
  if (idx <= 0) return null
  return translationKey.slice(0, idx)
}

const loadManualTranslationMap = async () => {
  const manual: Record<string, string> = {}
  for (const { file, exportName } of TRANSLATION_CONST_MODULES) {
    const fileUrl = pathToFileURL(path.join(translationsConstDir, file)).href
    const mod = (await import(fileUrl)) as Record<string, unknown>
    const chunk = mod[exportName]
    if (!chunk || typeof chunk !== 'object') {
      throw new Error(`Missing export "${exportName}" in ${file}`)
    }
    for (const [key, value] of Object.entries(chunk)) {
      if (typeof value === 'string') {
        manual[key] = value
      }
    }
  }
  return manual
}

const DETAIL_KEY_LOG_LIMIT = 10

const logIndentedKeySample = (input: {
  items: Array<string>
  indent: string
  subIndent: string
}) => {
  const { items, indent, subIndent } = input
  if (items.length === 0) return
  const shown = items.slice(0, DETAIL_KEY_LOG_LIMIT)
  console.log(`${indent}sample (${shown.length} of ${items.length}):`)
  for (const key of shown) {
    console.log(`${subIndent}${key}`)
  }
  if (items.length > DETAIL_KEY_LOG_LIMIT) {
    console.log(`${subIndent}… +${items.length - DETAIL_KEY_LOG_LIMIT} more`)
  }
}

type TranslationConstVsYamlReport = {
  mismatches: Array<{ key: string; manual: string; yaml: string }>
  orphansInManual: Array<string>
  inconsistentAllKeys: Array<{ key: string; labels: Array<string>; yamlKeys: Array<string> }>
  yamlOnlyKeys: Array<string>
}

const checkTranslationConstVsYaml = async (input: {
  expectedFromYaml: Record<string, string>
  topicDocsSourceIds: Set<string>
}): Promise<{ report: TranslationConstVsYamlReport; failed: boolean }> => {
  const manualMap = await loadManualTranslationMap()
  const { expectedFromYaml, topicDocsSourceIds } = input

  const mismatches: TranslationConstVsYamlReport['mismatches'] = []
  const orphansInManual: Array<string> = []
  const inconsistentAllKeys: TranslationConstVsYamlReport['inconsistentAllKeys'] = []

  const keyInScope = (key: string) => {
    if (key.startsWith('ALL--')) return true
    const prefix = sourcePrefixBeforeDoubleDash(key)
    return Boolean(prefix && topicDocsSourceIds.has(prefix))
  }

  for (const key of Object.keys(manualMap).sort()) {
    if (!keyInScope(key)) continue

    const manual = manualMap[key] ?? ''

    if (key.startsWith('ALL--')) {
      const rest = key.slice('ALL--'.length)
      const labels = new Set<string>()
      const yamlKeys: Array<string> = []
      for (const sourceId of topicDocsSourceIds) {
        const candidate = `${sourceId}--${rest}`
        const yaml = expectedFromYaml[candidate]
        if (yaml !== undefined) {
          labels.add(yaml)
          yamlKeys.push(candidate)
        }
      }
      if (labels.size === 0) {
        // Global ALL-- fallbacks (e.g. bike `category` / `highway`) often have no topic-docs counterpart.
        continue
      } else if (labels.size > 1) {
        inconsistentAllKeys.push({
          key,
          labels: [...labels].sort(),
          yamlKeys: [...yamlKeys].sort(),
        })
      } else if (manual !== [...labels][0]) {
        mismatches.push({ key, manual, yaml: [...labels][0] ?? '' })
      }
      continue
    }

    const yaml = expectedFromYaml[key]
    if (yaml === undefined) {
      orphansInManual.push(key)
    } else if (manual !== yaml) {
      mismatches.push({ key, manual, yaml })
    }
  }

  const yamlOnlyKeys: Array<string> = []
  for (const yamlKey of Object.keys(expectedFromYaml).sort()) {
    const prefix = sourcePrefixBeforeDoubleDash(yamlKey)
    if (!prefix || !topicDocsSourceIds.has(prefix)) continue
    if (manualMap[yamlKey] === undefined) {
      yamlOnlyKeys.push(yamlKey)
    }
  }

  const failed =
    mismatches.length > 0 || orphansInManual.length > 0 || inconsistentAllKeys.length > 0

  return {
    report: { mismatches, orphansInManual, inconsistentAllKeys, yamlOnlyKeys },
    failed,
  }
}

const logTranslationConstVsYaml = (report: TranslationConstVsYamlReport) => {
  console.log('\n[translation const vs topic-docs YAML]')
  console.log(`  mismatches (same key, different string): ${report.mismatches.length}`)
  console.log(
    `  orphans (in scoped manual const, not in YAML output): ${report.orphansInManual.length}`,
  )
  console.log(
    `  inconsistent ALL-- (YAML labels differ per sourceId): ${report.inconsistentAllKeys.length}`,
  )
  console.log(
    `  yaml-only keys (in generated YAML output, not in manual const — info): ${report.yamlOnlyKeys.length}`,
  )
  logIndentedKeySample({
    items: report.yamlOnlyKeys,
    indent: '    ',
    subIndent: '      ',
  })

  const sample = (items: Array<string>, limit: number) =>
    items.length <= limit ? items : [...items.slice(0, limit), `… +${items.length - limit} more`]

  if (report.mismatches.length > 0) {
    console.log('\n  Mismatch samples:')
    for (const row of report.mismatches.slice(0, 20)) {
      console.log(`    ${row.key}`)
      console.log(`      manual: ${row.manual}`)
      console.log(`      yaml:   ${row.yaml}`)
    }
    if (report.mismatches.length > 20) {
      console.log(`    … +${report.mismatches.length - 20} more`)
    }
  }
  if (report.orphansInManual.length > 0) {
    console.log(`\n  Orphans in manual const: ${sample(report.orphansInManual, 30).join('\n    ')}`)
  }
  if (report.inconsistentAllKeys.length > 0) {
    console.log('\n  Inconsistent ALL-- keys:')
    for (const row of report.inconsistentAllKeys.slice(0, 10)) {
      console.log(`    ${row.key} → labels: ${row.labels.join(' | ')}`)
    }
  }
}

/** Full DB strings are composite (see `parkingConditionCategorySegment.ts`); YAML lists base tokens only. */
const SKIP_ENUMERATED_VALUE_COVERAGE_KEYS = new Set(['condition_category'])

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    table: { type: 'string' },
    'out-json': { type: 'string' },
    'report-dir': { type: 'string' },
    'database-url': { type: 'string' },
    source: { type: 'string' },
  },
  strict: true,
  allowPositionals: true,
})

const selectedTables =
  values.table
    ?.split(',')
    .map((tableName) => tableName.trim())
    .filter(Boolean) ?? Object.keys(docsByTable)

const resolveDatabaseUrl = () => {
  const explicit = values['database-url']?.trim()
  if (explicit) return explicit

  const sourceRaw = values.source?.trim()
  if (sourceRaw) {
    return getRemoteDatabaseUrl(z.enum(ALLOWED_SOURCES).parse(sourceRaw))
  }

  return getBaseDatabaseUrl()
}

const flattenValues = (valuesInput: Array<CompiledValue> | undefined) => {
  const valuesSet = new Set<string>()
  const visit = (nodes: Array<CompiledValue> | undefined) => {
    if (!nodes) return
    for (const node of nodes) {
      valuesSet.add(node.value)
      visit(node.children)
    }
  }
  visit(valuesInput)
  return valuesSet
}

const quoteIdentifier = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`

const loadUniquePairs = async (client: Client, tableName: string) => {
  const sql = `
    SELECT kv.key::text AS key, kv.value::text AS value
    FROM (
      SELECT (jsonb_each_text(tags)).*
      FROM public.${quoteIdentifier(tableName)}
    ) AS kv
    GROUP BY kv.key, kv.value
    ORDER BY kv.key, kv.value
  `
  const result = await client.query<DbPair>(sql)
  return result.rows
}

type DbCoverageRow = {
  tableName: string
  extraDbKeysNotInDocs: Array<string>
  missingDocKeys: Array<string>
  documentedValuesNotInDb: Array<string>
  typeMismatches: Array<string>
  missingDocValues: Array<string>
  missingInspectorKeys: Array<string>
  missingInspectorValues: Array<string>
}

const markdownBullets = (items: Array<string>) =>
  items.length === 0 ? '_none_\n' : `${items.map((line) => `- ${line}`).join('\n')}\n`

const writeTableMarkdownReport = async (input: { reportDir: string; row: DbCoverageRow }) => {
  const { reportDir, row } = input
  const filePath = path.join(reportDir, `${row.tableName}.md`)
  const body = [
    `# ${row.tableName}`,
    '',
    '## In DB, not in docs',
    '',
    '### Keys (tag keys not listed as attributes in topic-docs)',
    '',
    markdownBullets(row.extraDbKeysNotInDocs),
    '',
    '### Value pairs (documented key, value not in documented enum)',
    '',
    markdownBullets(row.missingDocValues),
    '',
    '## In docs, not in DB',
    '',
    '### Keys (documented attributes never present in tags)',
    '',
    markdownBullets(row.missingDocKeys),
    '',
    '### Documented enumerated values never observed (key has at least one tag in DB)',
    '',
    markdownBullets(row.documentedValuesNotInDb),
    '',
  ].join('\n')
  await Bun.write(filePath, body)
}

const run = async () => {
  const topicDocsSourceIds = collectTopicDocsSourceIds(docsByTable)
  const expectedFromYaml = buildExpectedFromYaml({
    genTranslations: translationMap,
    docs: docsByTable,
  })
  const translationSync = await checkTranslationConstVsYaml({
    expectedFromYaml,
    topicDocsSourceIds,
  })
  logTranslationConstVsYaml(translationSync.report)

  if (translationSync.failed) {
    if (values['out-json']) {
      await Bun.write(
        values['out-json'],
        `${JSON.stringify(
          {
            translationConstVsYaml: translationSync.report,
            dbCoverage: null,
          },
          null,
          2,
        )}\n`,
      )
    }
    console.error('\nCoverage check failed.')
    console.error(
      '  Translation const vs YAML: fix mismatches, orphans, or inconsistent ALL-- keys (see above).',
    )
    process.exit(1)
  }

  const dbUrl = resolveDatabaseUrl()
  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (looksLikeConnectionError(message)) {
      console.error(
        [
          'Database connection failed.',
          '  Local (default): same as the app — set DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME and run Postgres (e.g. Docker).',
          '  Remote: start the SSH tunnel, then pass --source staging or --source production (uses DATABASE_URL_* from .env), or pass --database-url.',
        ].join('\n'),
      )
    }
    throw error
  }
  const report: Array<DbCoverageRow> = []

  try {
    for (const tableName of selectedTables) {
      const compiled = docsByTable[tableName]
      if (!compiled) {
        throw new Error(`No compiled topic docs for table "${tableName}"`)
      }
      const dbPairs = await loadUniquePairs(client, tableName)
      const dbValuesByKey = new Map<string, Set<string>>()
      for (const pair of dbPairs) {
        if (!dbValuesByKey.has(pair.key)) dbValuesByKey.set(pair.key, new Set())
        const normalizedValue =
          pair.value === null || pair.value === undefined ? 'null' : pair.value
        dbValuesByKey.get(pair.key)?.add(normalizedValue)
      }

      const documentedKeys = new Set(compiled.attributes.map((attribute) => attribute.key))
      const documentedValuesByKey = new Map<string, Set<string>>(
        compiled.attributes.map((attribute) => [attribute.key, flattenValues(attribute.values)]),
      )
      const documentedTypeByKey = new Map<string, CompiledAttribute['type']>(
        compiled.attributes.map((attribute) => [attribute.key, attribute.type]),
      )

      const extraDbKeysNotInDocs: Array<string> = []
      for (const dbKey of dbValuesByKey.keys()) {
        if (!documentedKeys.has(dbKey)) {
          extraDbKeysNotInDocs.push(dbKey)
        }
      }
      extraDbKeysNotInDocs.sort()

      const missingDocKeys: Array<string> = []
      const documentedValuesNotInDb: Array<string> = []
      const typeMismatches: Array<string> = []
      const missingDocValues: Array<string> = []
      const missingInspectorKeys: Array<string> = []
      const missingInspectorValues: Array<string> = []

      for (const attribute of compiled.attributes) {
        const key = attribute.key
        const valuesSet = dbValuesByKey.get(key) ?? new Set<string>()
        if (valuesSet.size === 0) {
          missingDocKeys.push(key)
        }

        const documentedValues = documentedValuesByKey.get(key) ?? new Set<string>()
        const documentedType = documentedTypeByKey.get(key) ?? 'string'
        const inferredType = getExportAttributeType(key)
        const hasExplicitValues = documentedValues.size > 0

        const exportComparableType =
          documentedType === 'sanitized_strings' || documentedType === 'ignore'
            ? 'string'
            : documentedType
        if (exportComparableType !== inferredType) {
          typeMismatches.push(`${key} (docs:${documentedType}, export:${inferredType})`)
        }

        const skipValueChecks =
          SKIP_ENUMERATED_VALUE_COVERAGE_KEYS.has(key) ||
          (documentedType === 'number' && !hasExplicitValues) ||
          (documentedType === 'string' && !hasExplicitValues) ||
          (documentedType === 'sanitized_strings' && !hasExplicitValues) ||
          (documentedType === 'ignore' && !hasExplicitValues)

        if (!skipValueChecks) {
          for (const value of valuesSet) {
            if (value === 'null') continue
            if (!documentedValues.has(value)) {
              missingDocValues.push(`${key}=${value}`)
            }
          }
        }

        if (!skipValueChecks && hasExplicitValues && valuesSet.size > 0) {
          for (const docValue of documentedValues) {
            if (!valuesSet.has(docValue)) {
              documentedValuesNotInDb.push(`${key}=${docValue}`)
            }
          }
        }

        if (documentedType !== 'ignore') {
          const hasKeyTranslation = compiled.sourceIds.some(
            (sourceId) =>
              Boolean(translationMap[`${sourceId}--${key}--key`]) ||
              Boolean(translationMap[`ALL--${key}--key`]),
          )
          if (!hasKeyTranslation) {
            missingInspectorKeys.push(key)
          }

          if (!skipValueChecks) {
            for (const value of valuesSet) {
              if (value === 'null') continue
              const hasValueTranslation = compiled.sourceIds.some(
                (sourceId) =>
                  Boolean(translationMap[`${sourceId}--${key}=${value}`]) ||
                  Boolean(translationMap[`ALL--${key}=${value}`]),
              )
              if (!hasValueTranslation) {
                missingInspectorValues.push(`${key}=${value}`)
              }
            }
          }
        }
      }

      report.push({
        tableName,
        extraDbKeysNotInDocs,
        missingDocKeys: [...new Set(missingDocKeys)].sort(),
        documentedValuesNotInDb: [...new Set(documentedValuesNotInDb)].sort(),
        typeMismatches: [...new Set(typeMismatches)].sort(),
        missingDocValues: [...new Set(missingDocValues)].sort(),
        missingInspectorKeys: [...new Set(missingInspectorKeys)].sort(),
        missingInspectorValues: [...new Set(missingInspectorValues)].sort(),
      })
    }
  } finally {
    await client.end()
  }

  const totals = report.reduce(
    (acc, row) => {
      acc.extraDbKeysNotInDocs += row.extraDbKeysNotInDocs.length
      acc.missingDocKeys += row.missingDocKeys.length
      acc.documentedValuesNotInDb += row.documentedValuesNotInDb.length
      acc.typeMismatches += row.typeMismatches.length
      acc.missingDocValues += row.missingDocValues.length
      acc.missingInspectorKeys += row.missingInspectorKeys.length
      acc.missingInspectorValues += row.missingInspectorValues.length
      return acc
    },
    {
      extraDbKeysNotInDocs: 0,
      missingDocKeys: 0,
      documentedValuesNotInDb: 0,
      typeMismatches: 0,
      missingDocValues: 0,
      missingInspectorKeys: 0,
      missingInspectorValues: 0,
    },
  )

  const reportDirRaw = values['report-dir']?.trim()
  if (reportDirRaw) {
    const reportDir = path.resolve(reportDirRaw)
    await mkdir(reportDir, { recursive: true })
    for (const row of report) {
      await writeTableMarkdownReport({ reportDir, row })
    }
    console.log(`\nWrote per-table markdown reports to: ${reportDir}`)
  }

  if (values['out-json']) {
    await Bun.write(
      values['out-json'],
      `${JSON.stringify(
        {
          translationConstVsYaml: translationSync.report,
          dbCoverage: report,
        },
        null,
        2,
      )}\n`,
    )
  }

  for (const row of report) {
    console.log(`\n[${row.tableName}]`)
    console.log(`  DB keys not in topic-docs (info): ${row.extraDbKeysNotInDocs.length}`)
    console.log(`  documented keys absent from DB tags: ${row.missingDocKeys.length}`)
    logIndentedKeySample({
      items: row.missingDocKeys,
      indent: '    ',
      subIndent: '      ',
    })
    console.log(
      `  documented enum values never observed in DB (info): ${row.documentedValuesNotInDb.length}`,
    )
    logIndentedKeySample({
      items: row.documentedValuesNotInDb,
      indent: '    ',
      subIndent: '      ',
    })
    console.log(`  type mismatches: ${row.typeMismatches.length}`)
    console.log(`  DB values not in documented enum: ${row.missingDocValues.length}`)
    console.log(`  missing inspector keys: ${row.missingInspectorKeys.length}`)
    console.log(`  missing inspector values: ${row.missingInspectorValues.length}`)
  }

  const dbFailed =
    totals.typeMismatches > 0 ||
    totals.missingDocValues > 0 ||
    totals.missingInspectorKeys > 0 ||
    totals.missingInspectorValues > 0

  if (translationSync.failed || dbFailed) {
    console.error('\nCoverage check failed.')
    if (translationSync.failed) {
      console.error(
        '  Translation const vs YAML: fix mismatches, orphans, or inconsistent ALL-- keys (see above).',
      )
    }
    if (dbFailed) {
      console.error('  DB / topic-docs / inspector coverage: see table sections above.')
    }
    process.exit(1)
  }

  console.log('\nCoverage check passed.')
}

await run()
