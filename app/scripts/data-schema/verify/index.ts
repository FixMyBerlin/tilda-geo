#!/usr/bin/env bun
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
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
  if (!existsSync(dataSchemaRootDir())) return []
  const entries = await readdir(dataSchemaRootDir(), { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter(
      (name) => dataSchemaIdentifierRegex.test(name) && existsSync(dataSchemaLocalSpecPath(name)),
    )
}

async function verifyTable(table: string) {
  const specPath = dataSchemaLocalSpecPath(table)
  if (!existsSync(specPath)) {
    throw new Error(`Local spec not found: ${specPath}`)
  }
  parseDataSchemaSpec(JSON.parse(await readFile(specPath, 'utf8')), table)
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
