#!/usr/bin/env nub
import { mkdirSync } from 'node:fs'
import * as p from '@clack/prompts'
import { argv } from '@/scripts/lib/bun'
import {
  DEFAULT_OUTPUT_DIR,
  type CliOptions,
  parseCliArgs,
  printHelp,
  qualifiedTableName,
  resolveFilePath,
  suggestTableFromFile,
} from './args'
import { assertDevelopmentEnvironment, getDatabaseUrl, getRowCount, tableExists } from './db'
import { exportProductionSql } from './export'
import { assertOgrToolsPresent, getSourceFeatureCount, runOgr2ogrImport } from './import'

async function resolveInteractiveOptions(partial: CliOptions) {
  let filePath = partial.filePath
  let tableName = partial.tableName

  if (!filePath) {
    const entered = await p.text({
      message: 'Path to GeoJSON file',
      validate: (v) => (!v?.trim() ? 'Required' : undefined),
    })
    if (p.isCancel(entered) || !entered?.trim()) {
      p.cancel('Cancelled.')
      process.exit(0)
    }
    filePath = resolveFilePath(entered.trim())
  }

  if (!tableName) {
    const suggested = suggestTableFromFile(filePath)
    const entered = await p.text({
      message: 'Target table name (schema data.)',
      initialValue: suggested,
      validate: (v) => (!v?.trim() ? 'Required' : undefined),
    })
    if (p.isCancel(entered) || !entered?.trim()) {
      p.cancel('Cancelled.')
      process.exit(0)
    }
    tableName = entered.trim()
  }

  const exists = await tableExists(tableName)
  let replace = partial.replace || partial.yes
  let create = partial.create

  if (exists && !replace && !create) {
    const currentRows = await getRowCount(tableName)
    const action = await p.select({
      message: `Table ${qualifiedTableName(tableName)} exists (${currentRows.toLocaleString()} rows). What should we do?`,
      options: [
        { value: 'replace', label: 'Replace (ogr2ogr OVERWRITE)' },
        { value: 'cancel', label: 'Cancel' },
      ],
    })
    if (p.isCancel(action) || action === 'cancel') {
      p.cancel('Cancelled.')
      process.exit(0)
    }
    replace = true
  }

  if (!exists && !create && !replace) {
    const action = await p.confirm({
      message: `Table ${qualifiedTableName(tableName)} does not exist. Create and load?`,
      initialValue: true,
    })
    if (p.isCancel(action) || !action) {
      p.cancel('Cancelled.')
      process.exit(0)
    }
    create = true
  }

  if (exists && create) {
    throw new Error('Table already exists. Use --replace instead of --create.')
  }

  return {
    filePath,
    tableName,
    replace: exists ? replace : false,
    create: !exists,
    noExport: partial.noExport,
    outputDir: partial.outputDir ?? DEFAULT_OUTPUT_DIR,
    dryRun: partial.dryRun,
  }
}

function resolveNonInteractiveOptions(partial: CliOptions) {
  const { filePath, tableName } = partial
  if (!filePath || !tableName) {
    throw new Error('Missing --file or --table in non-interactive mode.')
  }
  return {
    filePath,
    tableName,
    replace: partial.replace || partial.yes,
    create: partial.create,
    noExport: partial.noExport,
    outputDir: partial.outputDir ?? DEFAULT_OUTPUT_DIR,
    dryRun: partial.dryRun,
  }
}

async function main() {
  const parsed = parseCliArgs(argv)
  if (parsed.help) {
    printHelp()
    return
  }

  const canPrompt = process.stdin.isTTY
  if (!canPrompt && !parsed.file) {
    printHelp()
    throw new Error('Missing --file in non-interactive mode.')
  }
  if (!canPrompt && !parsed.table) {
    throw new Error('Missing --table in non-interactive mode.')
  }
  if (parsed.replace && parsed.create) {
    throw new Error('Use only one of --replace or --create.')
  }

  if (!parsed.dryRun) {
    assertDevelopmentEnvironment()
    await assertOgrToolsPresent()
  }

  const partial: CliOptions = {
    ...parsed,
    filePath: parsed.file ? resolveFilePath(parsed.file) : undefined,
    tableName: parsed.table,
    outputDir: parsed.outputDir ?? DEFAULT_OUTPUT_DIR,
  }

  if (canPrompt) {
    p.intro('parking-cutouts-import')
  }

  const options = canPrompt
    ? await resolveInteractiveOptions(partial)
    : resolveNonInteractiveOptions(partial)

  const { filePath, tableName, replace, create, noExport, outputDir, dryRun } = options
  const qualified = qualifiedTableName(tableName)
  const exists = await tableExists(tableName)

  if (!dryRun) {
    assertDevelopmentEnvironment()
  }

  if (!canPrompt) {
    if (exists && !replace && !create) {
      throw new Error(`Table ${qualified} already exists. Pass --replace (or -y) to replace data.`)
    }
    if (!exists && !create && !replace) {
      throw new Error(`Table ${qualified} does not exist. Pass --create or --replace to create it.`)
    }
    if (exists && create) {
      throw new Error(`Table ${qualified} already exists. Use --replace instead of --create.`)
    }
  }

  const overwrite = exists && replace

  if (!canPrompt) {
    p.intro('parking-cutouts-import')
  }

  const sourceCount = await getSourceFeatureCount(filePath)
  p.log.info(`Source features: ${sourceCount.toLocaleString()}`)

  if (exists) {
    const before = await getRowCount(tableName)
    p.log.info(`Current rows in ${qualified}: ${before.toLocaleString()}`)
  }

  const databaseUrl = getDatabaseUrl()

  if (dryRun) {
    const planned = await runOgr2ogrImport({
      filePath,
      tableName,
      schema: 'data',
      databaseUrl,
      overwrite,
      dryRun: true,
    })
    p.log.step(planned.command)
  } else {
    const spinner = p.spinner()
    spinner.start(
      overwrite ? `Replacing ${qualified} (ogr2ogr OVERWRITE)…` : `Importing into ${qualified}…`,
    )
    await runOgr2ogrImport({
      filePath,
      tableName,
      schema: 'data',
      databaseUrl,
      overwrite,
      dryRun: false,
    })
    spinner.stop(`Imported into ${qualified}.`)
  }

  if (!dryRun) {
    const dbCount = await getRowCount(tableName)
    if (dbCount !== sourceCount) {
      p.log.error(`Row count mismatch: source=${sourceCount}, database=${dbCount}`)
      process.exit(1)
    }
    p.log.success(`Verified row count: ${dbCount.toLocaleString()}`)
  }

  if (!noExport) {
    mkdirSync(outputDir, { recursive: true })
    const dbCountForExport = dryRun ? sourceCount : await getRowCount(tableName)
    if (dryRun) {
      const planned = await exportProductionSql({
        tableName,
        outputDir,
        sourceFile: filePath,
        rowCount: dbCountForExport,
        dryRun: true,
      })
      if (planned.command !== undefined) p.log.step(planned.command)
    } else {
      const spinner = p.spinner()
      spinner.start('Exporting production SQL…')
      const { outputPath } = await exportProductionSql({
        tableName,
        outputDir,
        sourceFile: filePath,
        rowCount: dbCountForExport,
        dryRun: false,
      })
      spinner.stop(`Wrote ${outputPath}`)
    }
  }

  p.outro(dryRun ? 'Dry run complete.' : 'Done.')
}

main().catch((error) => {
  p.log.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
