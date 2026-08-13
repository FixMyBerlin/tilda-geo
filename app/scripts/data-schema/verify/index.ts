#!/usr/bin/env bun
import * as p from '@clack/prompts'
import {
  dataSchemaLocalSpecPath,
  dataSchemaRootDir,
} from '@/server/dataSchema/dataSchemaLocalPaths'
import {
  dataSchemaIdentifierRegex,
  parseDataSchemaSpec,
} from '@/server/dataSchema/dataSchemaSpec.schema'
import { runCli } from '../cli'
import { parseVerifyArgs, printVerifyHelp } from './args'

async function listLocalTablesWithSpec() {
  const tables: string[] = []
  try {
    for await (const match of new Bun.Glob('*/spec.json').scan({
      cwd: dataSchemaRootDir(),
      onlyFiles: true,
    })) {
      const table = match.split('/')[0] ?? ''
      if (dataSchemaIdentifierRegex.test(table)) tables.push(table)
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return []
    throw error
  }
  return tables
}

async function verifyTable(table: string) {
  const specPath = dataSchemaLocalSpecPath(table)
  const specFile = Bun.file(specPath)
  if (!(await specFile.exists())) {
    throw new Error(`Local spec not found: ${specPath}`)
  }
  parseDataSchemaSpec(await specFile.json(), table)
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
    throw new Error('No local spec.json found under data-schema/')
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
