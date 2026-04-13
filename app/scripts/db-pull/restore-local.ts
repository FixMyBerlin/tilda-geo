#!/usr/bin/env bun

import { basename, dirname } from 'node:path'
import * as p from '@clack/prompts'
import { $ } from 'bun'
import { z } from 'zod'
import {
  ALLOWED_SCHEMAS,
  ALLOWED_SOURCES,
  assertDumpFilePresent,
  assertLocalRestoreTarget,
  getDumpFilePath,
  getLocalTargetDatabaseUrl,
  parseCliArgs,
  POSTGRES_CLI_IMAGE,
  PRE_RESTORE_SQL_PATH,
  toDockerNetworkUrl,
} from './db-helpers'

function printHelp() {
  process.stdout.write(`db-restore

Restore a schema-scoped SQL dump into the local development database only.

Usage:
  bun scripts/db-pull/restore-local.ts [--schema prisma|data] [--source production|staging]

Examples:
  bun scripts/db-pull/restore-local.ts
  bun scripts/db-pull/restore-local.ts --schema data --source staging

Notes:
  - Allowed schemas: ${ALLOWED_SCHEMAS.join(', ')}
  - Allowed dump sources: ${ALLOWED_SOURCES.join(', ')}
  - When --schema / --source are omitted in a TTY, interactive prompts are shown.
  - In non-interactive mode, pass both --schema and --source explicitly.
  - Uses Dockerized psql (${POSTGRES_CLI_IMAGE}) to avoid local client version issues.
`)
}

async function main() {
  const { help, schema: schemaArg, source: sourceArg } = parseCliArgs(Bun.argv)
  if (help) {
    printHelp()
    return
  }

  let schema = schemaArg
  let source = sourceArg

  if (!schema || !source) {
    if (!process.stdin.isTTY) {
      throw new Error(
        'Missing required args in non-interactive mode. Pass --schema <prisma|data> and --source <production|staging>.',
      )
    }

    printHelp()
    p.intro('db-restore')

    if (!schema) {
      const selected = await p.select({
        message: 'Select schema to restore',
        initialValue: 'prisma',
        options: ALLOWED_SCHEMAS.map((value) => ({ value, label: value })),
      })
      if (p.isCancel(selected)) {
        p.cancel('Cancelled.')
        return
      }
      schema = z.enum(ALLOWED_SCHEMAS).parse(selected)
    }

    if (!source) {
      const selected = await p.select({
        message: 'Select source dump',
        initialValue: 'production',
        options: ALLOWED_SOURCES.map((value) => ({ value, label: value })),
      })
      if (p.isCancel(selected)) {
        p.cancel('Cancelled.')
        return
      }
      source = z.enum(ALLOWED_SOURCES).parse(selected)
    }
  }

  if (!schema || !source) {
    throw new Error('Missing required schema/source after argument resolution.')
  }

  const dumpPath = getDumpFilePath(source, schema)
  const targetUrl = getLocalTargetDatabaseUrl()
  const dockerTargetUrl = toDockerNetworkUrl(targetUrl)
  const preRestoreDir = dirname(PRE_RESTORE_SQL_PATH)
  const dumpDir = dirname(dumpPath)
  const dockerPreRestorePath = '/sql/pre-restore.sql'
  const dockerDumpPath = `/dump/${basename(dumpPath)}`

  assertLocalRestoreTarget(targetUrl)
  assertDumpFilePresent(dumpPath)

  const resetResult =
    await $`docker run --rm --volume ${preRestoreDir}:/sql:ro --entrypoint psql ${POSTGRES_CLI_IMAGE} --set=ON_ERROR_STOP=1 --set=schema=${schema} --file=${dockerPreRestorePath} ${dockerTargetUrl}`
      .quiet()
      .nothrow()
  if (resetResult.exitCode !== 0) {
    const stderr = resetResult.stderr.toString().trim()
    throw new Error(stderr || `Schema reset failed with exit code ${resetResult.exitCode}`)
  }

  const restoreResult =
    await $`docker run --rm --volume ${dumpDir}:/dump:ro --entrypoint psql ${POSTGRES_CLI_IMAGE} --set=ON_ERROR_STOP=1 --single-transaction --file=${dockerDumpPath} ${dockerTargetUrl}`
      .quiet()
      .nothrow()
  if (restoreResult.exitCode !== 0) {
    const stderr = restoreResult.stderr.toString().trim()
    throw new Error(stderr || `Schema restore failed with exit code ${restoreResult.exitCode}`)
  }

  const verifyResult =
    await $`docker run --rm --entrypoint psql ${POSTGRES_CLI_IMAGE} --tuples-only --no-align --command=${`SELECT count(*) FROM information_schema.tables WHERE table_schema = '${schema}';`} ${dockerTargetUrl}`
      .quiet()
      .nothrow()
  if (verifyResult.exitCode !== 0) {
    const stderr = verifyResult.stderr.toString().trim()
    throw new Error(stderr || `Schema verification failed with exit code ${verifyResult.exitCode}`)
  }
  const tableCount = Number.parseInt(verifyResult.text().trim(), 10)
  if (!Number.isFinite(tableCount) || tableCount <= 0) {
    throw new Error(`Restore verification failed: schema "${schema}" has no tables after restore.`)
  }

  process.stdout.write(
    `Restored ${schema} schema from ${source} dump into local DB (${tableCount} tables).\n`,
  )
}

await main()
