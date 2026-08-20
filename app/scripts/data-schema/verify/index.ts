#!/usr/bin/env bun
import * as p from '@clack/prompts'
import { dataSchemaLocalSpecPath, loadLocalSpec } from '@/server/dataSchema/dataSchemaLocalPaths'
import { runCli } from '../cli'
import { listLocalTablesWithSpec } from '../localTables'
import { parseVerifyArgs, printVerifyHelp } from './args'

async function verifyTable(table: string) {
  const specPath = dataSchemaLocalSpecPath(table)
  if (!(await loadLocalSpec(table))) {
    throw new Error(`Local spec not found: ${specPath}`)
  }
  p.log.success(`${table}: ${specPath}`)
}

async function runVerify(argv: string[]) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printVerifyHelp()
    return
  }

  const options = parseVerifyArgs(argv)
  const tables = options.table ? [options.table] : await listLocalTablesWithSpec()
  if (tables.length === 0) {
    throw new Error('No local spec.yaml found under data-schema/')
  }

  p.intro('data-schema-verify')
  for (const table of tables) {
    await verifyTable(table)
  }
  p.outro(`${tables.length === 1 ? 'Spec OK' : `${tables.length} specs OK`}.`)
}

if (import.meta.main) {
  await runCli(runVerify)
}
