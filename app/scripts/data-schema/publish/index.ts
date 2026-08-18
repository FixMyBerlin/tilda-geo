#!/usr/bin/env bun
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import * as p from '@clack/prompts'
import { $ } from 'bun'
import { buildDataSchemaManifest } from '@/server/dataSchema/buildDataSchemaManifest'
import { dataSchemaLocalSpecPath, loadLocalSpec } from '@/server/dataSchema/dataSchemaLocalPaths'
import {
  getDataSchemaManifestIfExists,
  getDataSchemaSpecIfExists,
  copyS3Object,
  putS3File,
  putS3Json,
  s3ObjectExists,
} from '@/server/dataSchema/dataSchemaS3.server'
import { pgDumpArchiveFlags } from '@/server/dataSchema/pgDumpArchiveFlags'
import {
  archiveLatestAsSnapshot,
  publishLatestDumpAndManifest,
} from '@/server/dataSchema/publishDataSchemaArtifacts'
import { resolveDataSchemaDumpKey } from '@/server/dataSchema/resolveLatestDataSchemaDumpKey'
import { sha256File } from '@/server/dataSchema/sha256File'
import {
  POSTGRES_CLI_IMAGE,
  getLocalTargetDatabaseUrl,
  toDockerNetworkUrl,
} from '../../db-pull/db-helpers'
import { getValidatedEnv, staticDatasetsS3CredentialsSchema } from '../../shared/env'
import { runCli } from '../cli'
import { SCHEMA, assertDevelopmentEnvironment, getRowCount } from '../db'
import { resolveSpecOverwrite } from '../specConflict'
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
      `Local spec not found: ${options.table} (write spec.json or run data-schema-pull)`,
    )
  }

  p.intro('data-schema-publish')

  const remoteSpec = await getDataSchemaSpecIfExists(options.table)
  const specWrite = await resolveSpecOverwrite({
    table: options.table,
    direction: 'publish',
    existing: remoteSpec,
    incoming: spec,
  })
  if (specWrite.write) {
    const localSpecPath = dataSchemaLocalSpecPath(options.table)
    await Bun.write(localSpecPath, JSON.stringify(spec, null, 2))
    await uploadSpecJson(options.table, localSpecPath)
  } else if (specWrite.reason !== 'same') {
    if (options.specOnly) {
      p.outro('Kept S3 spec.')
      return
    }
    throw new Error('Kept S3 spec; dump not published. Resolve the spec conflict and re-run.')
  }

  if (options.specOnly) {
    p.outro(specWrite.write ? 'Done (spec only; dump not published).' : 'S3 spec already matches.')
    return
  }

  assertDevelopmentEnvironment()

  const rowCount = await getRowCount(options.table)
  p.log.info(`Row count: ${rowCount.toLocaleString()}`)

  const previous = await getDataSchemaManifestIfExists(options.table)
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
      await $`docker run --rm --add-host=host.docker.internal:host-gateway --volume ${dumpDir}:/dump --entrypoint pg_dump ${POSTGRES_CLI_IMAGE} ${pgDumpArchiveFlags} --table=${SCHEMA}.${options.table} --file=${dockerDumpPath} ${dockerUrl}`
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
      sha256,
      rowCount,
    })

    const puts = {
      putFile: (key: string, filePath: string) => putS3File(key, filePath),
      putJson: (key: string, value: unknown) => putS3Json(key, value),
    }
    const written: string[] = []
    const bucket = process.env.S3_BUCKET

    if (writeSnapshot) {
      if (!previous) {
        p.log.warn('No previous dump to archive; publishing as current only.')
      } else {
        spinner.start(`Archiving previous dump (${previous.publishedAt})…`)
        const sourceDumpKey = await resolveDataSchemaDumpKey(options.table)
        const snap = await archiveLatestAsSnapshot(
          { table: options.table, previous, sourceDumpKey },
          {
            copyObject: (fromKey, toKey) => copyS3Object(fromKey, toKey),
            putJson: puts.putJson,
            objectExists: (key) => s3ObjectExists(key),
          },
        )
        spinner.stop(
          snap.skipped ? `Snapshot ${snap.snapshotId} already exists` : 'Archived previous dump.',
        )
        written.push(...snap.keys.map((key) => `s3://${bucket}/${key}`))
      }
    }

    spinner.start(`Uploading data.dump (${bytes.toLocaleString()} bytes)…`)
    const latest = await publishLatestDumpAndManifest(
      { table: options.table, dumpPath, manifest: latestManifest },
      puts,
    )
    spinner.stop('Uploaded data.dump.')
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
