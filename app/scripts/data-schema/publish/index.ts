#!/usr/bin/env bun
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import * as p from '@clack/prompts'
import { $ } from 'bun'
import { buildDataSchemaManifest } from '@/server/dataSchema/buildDataSchemaManifest'
import { dataSchemaLocalSourcePath, loadLocalSpec } from '@/server/dataSchema/dataSchemaLocalPaths'
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
import { uploadSpecJson } from './uploadSources'

async function runPublish(argv: string[]) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printPublishHelp()
    return
  }

  const options = parsePublishArgs(argv)
  getValidatedEnv(staticDatasetsS3CredentialsSchema)

  const spec = await loadLocalSpec(options.table)
  if (!spec) {
    throw new Error(
      `Local spec not found: ${options.table} (write spec.json or run data-schema-sync)`,
    )
  }

  p.intro('data-schema-publish')
  const { client, bucket } = createDataSchemaS3Client()
  await uploadSpecJson(client, bucket, options.table, spec)

  if (options.specOnly) {
    p.outro('Done (spec only; dump not published).')
    return
  }

  assertDevelopmentEnvironment()

  const specSha256 = createHash('sha256')
    .update(JSON.stringify(spec, null, 2))
    .digest('hex')
  const sourceFile = spec.source.file
  const localSource = dataSchemaLocalSourcePath(options.table, sourceFile)
  const sourceSha256 = (await Bun.file(localSource).exists())
    ? await sha256File(localSource)
    : undefined

  const rowCount = await getRowCount(options.table)
  p.log.info(`Row count: ${rowCount.toLocaleString()}`)

  const previous = await getLatestDataSchemaManifest(client, bucket, options.table)
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
    const publishedAt = new Date().toISOString()

    const latestManifest = buildDataSchemaManifest({
      table: options.table,
      publishedAt,
      snapshotId: null,
      bytes,
      sha256,
      rowCount,
      publishedBy: 'unknown',
      publishedFrom: 'development',
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
          snap.skipped ? `Snapshot ${snap.snapshotId} already exists` : 'Archived previous latest.',
        )
        written.push(...snap.keys.map((key) => `s3://${bucket}/${key}`))
      }
    }

    spinner.start(`Uploading latest dump (${bytes.toLocaleString()} bytes)…`)
    const latest = await publishLatestDumpAndManifest(
      { table: options.table, dumpPath, manifest: latestManifest },
      puts,
    )
    spinner.stop('Uploaded latest.')
    if (latest.warning) p.log.warn(latest.warning)

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
