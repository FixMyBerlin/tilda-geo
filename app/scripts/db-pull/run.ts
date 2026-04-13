#!/usr/bin/env bun

import * as p from '@clack/prompts'
import { $ } from 'bun'
import { z } from 'zod'
import { ALLOWED_SCHEMAS, ALLOWED_SOURCES, parseCliArgs } from './db-helpers'

function printHelp() {
  process.stdout.write(`db-pull (pull + restore)

Run remote pull and local restore in sequence.

Usage:
  bun scripts/db-pull/run.ts [--source production|staging] [--schema prisma|data]

Examples:
  bun scripts/db-pull/run.ts
  bun scripts/db-pull/run.ts --source staging --schema prisma

Notes:
  - In interactive mode (TTY), missing args are prompted once.
  - In non-interactive mode, pass both --source and --schema.
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
  let schema = schemaArg

  if (!source || !schema) {
    if (!process.stdin.isTTY) {
      throw new Error(
        'Missing required args in non-interactive mode. Pass --source <production|staging> and --schema <prisma|data>.',
      )
    }

    printHelp()
    p.intro('db-pull')

    if (!source) {
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

    if (!schema) {
      const selected = await p.select({
        message: 'Select schema',
        initialValue: 'prisma',
        options: ALLOWED_SCHEMAS.map((value) => ({ value, label: value })),
      })
      if (p.isCancel(selected)) {
        p.cancel('Cancelled.')
        return
      }
      schema = z.enum(ALLOWED_SCHEMAS).parse(selected)
    }
  }

  if (!source || !schema) {
    throw new Error('Missing source/schema after argument resolution.')
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
