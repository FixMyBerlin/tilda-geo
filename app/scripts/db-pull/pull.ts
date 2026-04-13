#!/usr/bin/env bun

import { basename, dirname } from 'node:path'
import * as p from '@clack/prompts'
import { $ } from 'bun'
import { z } from 'zod'
import {
  ALLOWED_SCHEMAS,
  ALLOWED_SOURCES,
  assertDumpFilePresent,
  ensureDataDir,
  getDumpFilePath,
  getRemoteDatabaseUrl,
  looksLikeConnectionError,
  parseCliArgs,
  POSTGRES_CLI_IMAGE,
  printRemoteConnectionGuidance,
  toDockerNetworkUrl,
} from './db-helpers'

function printHelp() {
  process.stdout.write(`db-pull

Pull a schema-scoped SQL dump from a remote source database URL.

Usage:
  bun scripts/db-pull/pull.ts [--source production|staging] [--schema prisma|data]

Examples:
  bun scripts/db-pull/pull.ts --source production
  bun scripts/db-pull/pull.ts --source staging --schema data

Notes:
  - Allowed sources: ${ALLOWED_SOURCES.join(', ')}
  - Allowed schemas: ${ALLOWED_SCHEMAS.join(', ')}
  - Start SSH tunnel in terminal 1: ssh tilda-production-postgres-tunnel or ssh tilda-staging-postgres-tunnel
  - Run this CLI in terminal 2.
  - Tunnel setup docs: https://github.com/FixMyBerlin/dev-documentation/blob/main/server-management/ionos-tilda.md#use-the-ssh-tunnel
  - If --source is omitted in a TTY, interactive prompt is shown.
  - In non-interactive mode, pass --source explicitly.
  - Schema defaults to prisma when omitted.
  - Dump output: app/scripts/db-pull/data/<source>.<schema>.sql
  - Uses Dockerized pg_dump (${POSTGRES_CLI_IMAGE}) to avoid local client version issues.
`)
}

async function main() {
  const { help, source: sourceArg, schema: schemaArg } = parseCliArgs(Bun.argv)
  if (help) {
    printHelp()
    return
  }

  const schema = schemaArg ?? 'prisma'
  let source = sourceArg

  if (!source) {
    if (!process.stdin.isTTY) {
      throw new Error(
        'Missing required arg in non-interactive mode: --source <production|staging>.',
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

  const remoteUrl = getRemoteDatabaseUrl(source)
  const dockerRemoteUrl = toDockerNetworkUrl(remoteUrl)
  ensureDataDir()
  const dumpPath = getDumpFilePath(source, schema)
  const dumpDir = dirname(dumpPath)
  const dumpFile = basename(dumpPath)
  const dockerDumpPath = `/dump/${dumpFile}`

  const dumpResult =
    await $`docker run --rm --volume ${dumpDir}:/dump --entrypoint pg_dump ${POSTGRES_CLI_IMAGE} --no-owner --no-privileges --schema=${schema} --format=plain --file=${dockerDumpPath} ${dockerRemoteUrl}`
      .quiet()
      .nothrow()
  if (dumpResult.exitCode !== 0) {
    const stderr = dumpResult.stderr.toString().trim()
    if (looksLikeConnectionError(stderr)) {
      printRemoteConnectionGuidance(source, remoteUrl)
    }
    throw new Error(stderr || `pg_dump failed with exit code ${dumpResult.exitCode}`)
  }

  assertDumpFilePresent(dumpPath)
  process.stdout.write(`Created ${dumpPath}\n`)
}

function printFatalError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  p.log.error('db-pull failed')
  p.note(message, 'Error')
  if (message.includes('Missing DATABASE_URL_')) {
    p.note(
      'Add the missing DATABASE_URL_<SOURCE> to your local .env (see .env.example for tunnel URL format).',
      'How to fix',
    )
  }
}

try {
  await main()
} catch (error) {
  printFatalError(error)
  process.exit(1)
}
