#!/usr/bin/env bun
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import * as p from '@clack/prompts'
import { $ } from 'bun'
import {
  buildDataSchemaManifest,
  inheritLargeFromPreviousManifest,
} from '@/server/dataSchema/buildDataSchemaManifest'
import { dataSchemaLocalSourcePath } from '@/server/dataSchema/dataSchemaLocalPaths'
import {
  createDataSchemaS3Client,
  copyS3Object,
  putS3FileMultipart,
  putS3Json,
  s3ObjectExists,
} from '@/server/dataSchema/dataSchemaS3.server'
import { getLatestDataSchemaManifest } from '@/server/dataSchema/getLatestDataSchemaManifest'
import {
  archiveLatestAsSnapshot,
  publishLatestDumpAndManifest,
} from '@/server/dataSchema/publishDataSchemaArtifacts'
import { resolveLatestDataSchemaDumpKey } from '@/server/dataSchema/resolveLatestDataSchemaDumpKey'
import { sha256File } from '@/server/dataSchema/sha256File'
import {
  POSTGRES_CLI_IMAGE,
  getLocalTargetDatabaseUrl,
  toDockerNetworkUrl,
} from '../../db-pull/db-helpers'
import { getValidatedEnv, staticDatasetsS3CredentialsSchema } from '../../shared/env'
import { runCli } from '../cli'
import { SCHEMA, assertDevelopmentEnvironment, getRowCount } from '../db'
import { parsePublishArgs, printPublishHelp } from './args'
import { resolveWriteSnapshot } from './publishMode'
import { loadLocalSpec, uploadSourceFile, uploadSpecJson } from './uploadSources'

async function getPgDumpVersion() {
  const result = await $`docker run --rm --entrypoint pg_dump ${POSTGRES_CLI_IMAGE} --version`
    .quiet()
    .nothrow()
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString().trim() || 'pg_dump --version failed')
  }
  const text = result.stdout.toString().trim()
  const match = text.match(/(\d+\.\d+(?:\.\d+)?)/)
  return match?.[1] ?? text
}

async function runPublish(argv: string[]) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printPublishHelp()
    return
  }

  const options = parsePublishArgs(argv)
  getValidatedEnv(staticDatasetsS3CredentialsSchema)

  const loaded = await loadLocalSpec(options.table)
  if (options.specOnly && !loaded) {
    throw new Error(
      `Local spec not found: ${options.table} (needed for --spec-only; create spec.json first)`,
    )
  }
  if (options.withSourceFile && !loaded) {
    throw new Error(`Local spec not found: ${options.table} (needed for --with-source-file)`)
  }

  p.intro('data-schema-publish')
  const { client, bucket } = createDataSchemaS3Client()

  if (loaded) {
    await uploadSpecJson(client, bucket, options.table, loaded.spec)
  } else {
    p.log.info('No local spec.json — skipping sources/spec.json upload')
  }

  if (options.withSourceFile && loaded) {
    await uploadSourceFile(client, bucket, options.table, loaded.spec.source.file, options.force)
  }

  if (options.specOnly) {
    p.outro('Done (spec only; dump not published).')
    return
  }

  assertDevelopmentEnvironment()

  /** Explicit only when local spec.json sets `large`; otherwise inherit from S3 latest manifest. */
  const largeOverride = loaded?.largeOverride
  let sourceFile: string | undefined
  let sourceSha256: string | undefined
  let specSha256: string | undefined

  if (loaded) {
    sourceFile = loaded.spec.source.file
    const { createHash } = await import('node:crypto')
    specSha256 = createHash('sha256').update(loaded.raw).digest('hex')
    const localSource = dataSchemaLocalSourcePath(options.table, loaded.spec.source.file)
    if (await Bun.file(localSource).exists()) {
      sourceSha256 = await sha256File(localSource)
    }
  }

  const rowCount = await getRowCount(options.table)
  p.log.info(`Row count: ${rowCount.toLocaleString()}`)

  const previous = await getLatestDataSchemaManifest(client, bucket, options.table)
  const large = largeOverride ?? inheritLargeFromPreviousManifest(previous)
  const writeSnapshot = await resolveWriteSnapshot({
    explicitMode: options.mode,
    previousPublishedAt: previous?.publishedAt ?? null,
    table: options.table,
  })

  const tempDir = await mkdtemp(join(tmpdir(), 'data-schema-publish-'))
  const dumpPath = join(tempDir, 'table.dump')
  const dumpDir = dirname(dumpPath)
  const dumpFile = basename(dumpPath)
  const dockerDumpPath = `/dump/${dumpFile}`
  const databaseUrl = getLocalTargetDatabaseUrl()
  const dockerUrl = toDockerNetworkUrl(databaseUrl)

  try {
    const spinner = p.spinner()
    spinner.start(`pg_dump ${SCHEMA}.${options.table}…`)
    const dumpResult =
      await $`docker run --rm --add-host=host.docker.internal:host-gateway --volume ${dumpDir}:/dump --entrypoint pg_dump ${POSTGRES_CLI_IMAGE} --format=custom --no-owner --no-privileges --table=${SCHEMA}.${options.table} --file=${dockerDumpPath} ${dockerUrl}`
        .quiet()
        .nothrow()
    if (dumpResult.exitCode !== 0) {
      throw new Error(
        dumpResult.stderr.toString().trim() || `pg_dump failed (${dumpResult.exitCode})`,
      )
    }
    spinner.stop('Dump created.')

    const dump = Bun.file(dumpPath)
    if (!(await dump.exists()) || dump.size <= 0) {
      throw new Error(`Dump file missing or empty: ${dumpPath}`)
    }

    const bytes = dump.size
    const sha256 = await sha256File(dumpPath)
    const pgDumpVersion = await getPgDumpVersion()
    const publishedAt = new Date().toISOString()
    const publishedBy = process.env.USER?.trim() || process.env.LOGNAME?.trim() || 'unknown'
    const publishedFrom = process.env.ENVIRONMENT?.trim() || 'development'

    const latestManifest = buildDataSchemaManifest({
      table: options.table,
      publishedAt,
      snapshotId: null,
      bytes,
      sha256,
      rowCount,
      large,
      pgDumpVersion,
      publishedBy,
      publishedFrom,
      sourceFile,
      sourceSha256,
      specSha256,
    })

    const puts = {
      putFile: (key: string, filePath: string) => putS3FileMultipart(client, bucket, key, filePath),
      putJson: (key: string, value: unknown) => putS3Json(client, bucket, key, value),
    }
    const written: string[] = []

    if (writeSnapshot) {
      if (!previous) {
        p.log.warn('No previous latest/ to archive; publishing new dump as latest/ only.')
      } else {
        spinner.start(`Archiving previous latest (${previous.publishedAt})…`)
        const sourceDumpKey = await resolveLatestDataSchemaDumpKey(
          client,
          bucket,
          options.table,
          previous.file.sha256,
        )
        const snap = await archiveLatestAsSnapshot(
          { table: options.table, previous, sourceDumpKey },
          {
            copyObject: (fromKey, toKey) => copyS3Object(client, bucket, fromKey, toKey),
            putJson: puts.putJson,
            objectExists: (key) => s3ObjectExists(client, bucket, key),
          },
        )
        spinner.stop(
          snap.skipped
            ? `Snapshot ${snap.snapshotId} already exists`
            : `Archived s3://${bucket}/${snap.keys[0]}`,
        )
        written.push(...snap.keys.map((key) => `s3://${bucket}/${key}`))
      }
    }

    spinner.start(`Uploading latest dump (${bytes.toLocaleString()} bytes)…`)
    const latest = await publishLatestDumpAndManifest(
      { table: options.table, dumpPath, manifest: latestManifest },
      puts,
    )
    spinner.stop(
      latest.warning
        ? `Uploaded latest manifest (${latest.warning})`
        : `Uploaded s3://${bucket}/${latest.keys[0]}`,
    )

    written.push(...latest.keys.map((key) => `s3://${bucket}/${key}`))

    p.note(written.join('\n'), 'Written')
    p.outro(`Published ${SCHEMA}.${options.table} (sha256=${sha256.slice(0, 12)}…).`)
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

if (import.meta.main) {
  await runCli(runPublish)
}
