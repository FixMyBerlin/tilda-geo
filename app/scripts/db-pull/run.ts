#!/usr/bin/env bun

import * as p from '@clack/prompts'
import { $ } from 'bun'
import { z } from 'zod'
import { ALLOWED_SCHEMAS, ALLOWED_SOURCES, parseCliArgs, resolveSchemaArg } from './db-helpers'

function printHelp() {
  process.stdout.write(`db-pull (pull + restore)

Runs pull, then restore.

Usage:
  bun scripts/db-pull/run.ts [--source production|staging] [--schema ${ALLOWED_SCHEMAS.join('|')}]

Examples:
  bun scripts/db-pull/run.ts
  bun scripts/db-pull/run.ts --source staging

Notes:
  - Allowed schemas: ${ALLOWED_SCHEMAS.join(', ')}
  - Schema is prompted only when more than one is allowed.
  - In interactive mode (TTY), missing --source is prompted once.
  - In non-interactive mode, pass --source.
  - This command runs:
      1) bun run db-pull:pull -- --source <source> --schema <schema>
      2) bun run db-pull:restore -- --source <source> --schema <schema>
`)
}

async function main() {
  const { help, source: sourceArg, schema: schemaArg } = parseCliArgs(Bun.argv)
  if (help) {
    printHelp()
    return
  }

  let source = sourceArg
  const schema = await resolveSchemaArg(schemaArg)
  if (schema === null) {
    p.cancel('Cancelled.')
    return
  }

  if (!source) {
    if (!process.stdin.isTTY) {
      throw new Error(
        'Missing required arg in non-interactive mode. Pass --source <production|staging>.',
      )
    }

    printHelp()
    p.intro('db-pull')

    const selected = await p.select({
      message: 'Select source database',
      initialValue: 'production',
      options: ALLOWED_SOURCES.map((value) => ({ value, label: value })),
    })
    if (p.isCancel(selected)) {
      p.cancel('Cancelled.')
      return
    }
    source = z.enum(ALLOWED_SOURCES).parse(selected)
  }

  if (!source) {
    throw new Error('Missing source after argument resolution.')
  }

  const pullResult =
    await $`bun run db-pull:pull -- --source ${source} --schema ${schema}`.nothrow()
  if (pullResult.exitCode !== 0) {
    process.exit(pullResult.exitCode || 1)
  }
  const restoreResult =
    await $`bun run db-pull:restore -- --source ${source} --schema ${schema}`.nothrow()
  if (restoreResult.exitCode !== 0) {
    process.exit(restoreResult.exitCode || 1)
  }
}

try {
  await main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  p.log.error('db-pull failed')
  p.note(message, 'Error')
  process.exit(1)
}
