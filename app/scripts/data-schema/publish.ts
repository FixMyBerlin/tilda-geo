import { existsSync, statSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import * as p from '@clack/prompts'
import { $ } from 'bun'
import { buildDataSchemaManifest } from '@/server/dataSchema/buildDataSchemaManifest'
import {
  dataSchemaLocalSourcePath,
  dataSchemaLocalSpecPath,
} from '@/server/dataSchema/dataSchemaLocalPaths'
import {
  createDataSchemaS3Client,
  putS3FileMultipart,
  putS3Json,
} from '@/server/dataSchema/dataSchemaS3.server'
import { dataSchemaSnapshotId } from '@/server/dataSchema/dataSchemaS3Keys'
import { parseDataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'
import {
  publishLatestDumpAndManifest,
  publishSnapshotDumpAndManifest,
} from '@/server/dataSchema/publishDataSchemaArtifacts'
import { resolveLargeForRepublish } from '@/server/dataSchema/resolveLargeForRepublish'
import { sha256File } from '@/server/dataSchema/sha256File'
import { POSTGRES_CLI_IMAGE, toDockerNetworkUrl } from '../db-pull/db-helpers'
import { getValidatedEnv, staticDatasetsS3CredentialsSchema } from '../shared/env'
import { parsePublishArgs, printCommandHelp } from './args'
import { SCHEMA, assertDevelopmentEnvironment, getDatabaseUrl, getRowCount } from './db'

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

export async function runPublish(argv: string[]) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printCommandHelp('publish')
    return
  }

  const options = parsePublishArgs(argv)
  assertDevelopmentEnvironment()
  getValidatedEnv(staticDatasetsS3CredentialsSchema)

  const localSpecPath = dataSchemaLocalSpecPath(options.table)
  /** Explicit only when local spec.json sets `large`; otherwise inherit from S3 latest manifest. */
  let largeOverride: boolean | undefined
  let sourceFile: string | undefined
  let sourceSha256: string | undefined
  let specSha256: string | undefined

  if (existsSync(localSpecPath)) {
    const raw = await readFile(localSpecPath, 'utf8')
    const rawJson = JSON.parse(raw) as { large?: unknown }
    const spec = parseDataSchemaSpec(rawJson, options.table)
    if (typeof rawJson.large === 'boolean') {
      largeOverride = rawJson.large
    }
    sourceFile = spec.source.file
    const { createHash } = await import('node:crypto')
    specSha256 = createHash('sha256').update(raw).digest('hex')
    const localSource = dataSchemaLocalSourcePath(options.table, spec.source.file)
    if (existsSync(localSource)) {
      sourceSha256 = await sha256File(localSource)
    }
  }

  p.intro('data-schema publish')
  const rowCount = await getRowCount(options.table)
  p.log.info(`Row count: ${rowCount.toLocaleString()}`)

  const tempDir = await mkdtemp(join(tmpdir(), 'data-schema-publish-'))
  const dumpPath = join(tempDir, 'table.dump')
  const dumpDir = dirname(dumpPath)
  const dumpFile = basename(dumpPath)
  const dockerDumpPath = `/dump/${dumpFile}`
  const databaseUrl = getDatabaseUrl()
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

    if (!existsSync(dumpPath) || statSync(dumpPath).size <= 0) {
      throw new Error(`Dump file missing or empty: ${dumpPath}`)
    }

    const bytes = statSync(dumpPath).size
    const sha256 = await sha256File(dumpPath)
    const pgDumpVersion = await getPgDumpVersion()
    const publishedAt = new Date().toISOString()
    const publishedBy = process.env.USER?.trim() || process.env.LOGNAME?.trim() || 'unknown'
    const publishedFrom = process.env.ENVIRONMENT?.trim() || 'development'

    const { client, bucket } = createDataSchemaS3Client()
    const large = await resolveLargeForRepublish(client, bucket, options.table, largeOverride)

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

    const written = latest.keys.map((key) => `s3://${bucket}/${key}`)

    if (options.snapshot) {
      const snapshotId = dataSchemaSnapshotId()
      const snapshotManifest = buildDataSchemaManifest({
        table: options.table,
        publishedAt,
        snapshotId,
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
      spinner.start(`Uploading snapshot ${snapshotId}…`)
      const snap = await publishSnapshotDumpAndManifest(
        { table: options.table, snapshotId, dumpPath, manifest: snapshotManifest },
        puts,
      )
      spinner.stop(`Uploaded s3://${bucket}/${snap.keys[0]}`)
      written.push(...snap.keys.map((key) => `s3://${bucket}/${key}`))
    }

    p.note(written.join('\n'), 'Written')
    p.outro(`Published ${SCHEMA}.${options.table} (sha256=${sha256.slice(0, 12)}…).`)
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}
