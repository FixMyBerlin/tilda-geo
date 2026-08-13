import { existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import * as p from '@clack/prompts'
import {
  dataSchemaLocalSourcePath,
  dataSchemaLocalSpecPath,
} from '@/server/dataSchema/dataSchemaLocalPaths'
import {
  createDataSchemaS3Client,
  putS3FileMultipart,
  putS3Json,
} from '@/server/dataSchema/dataSchemaS3.server'
import { dataSchemaSourceFileKey, dataSchemaSpecKey } from '@/server/dataSchema/dataSchemaS3Keys'
import { parseDataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'
import { getValidatedEnv, staticDatasetsS3CredentialsSchema } from '../shared/env'
import { parsePublishSpecArgs, printCommandHelp } from './args'

const RAW_UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024

export async function runPublishSpec(argv: string[]) {
  // Allow --help without --table
  if (argv.includes('--help') || argv.includes('-h')) {
    printCommandHelp('publish-spec')
    return
  }

  const options = parsePublishSpecArgs(argv)
  getValidatedEnv(staticDatasetsS3CredentialsSchema)

  const localSpecPath = dataSchemaLocalSpecPath(options.table)
  if (!existsSync(localSpecPath)) {
    throw new Error(`Local spec not found: ${localSpecPath}`)
  }

  const spec = parseDataSchemaSpec(JSON.parse(await readFile(localSpecPath, 'utf8')), options.table)

  p.intro('data-schema publish-spec')
  const { client, bucket } = createDataSchemaS3Client()
  const specKey = dataSchemaSpecKey(options.table)
  await putS3Json(client, bucket, specKey, spec)
  p.log.success(`Uploaded s3://${bucket}/${specKey}`)

  if (options.withRaw) {
    const localSource = dataSchemaLocalSourcePath(options.table, spec.source.file)
    if (!existsSync(localSource)) {
      throw new Error(`Local source file not found: ${localSource}`)
    }
    const size = statSync(localSource).size
    if (size > RAW_UPLOAD_LIMIT_BYTES && !options.force) {
      throw new Error(
        `Source file is ${(size / (1024 * 1024)).toFixed(1)} MB (>100 MB). Pass --force to upload anyway.`,
      )
    }
    const sourceKey = dataSchemaSourceFileKey(options.table, spec.source.file)
    await putS3FileMultipart(client, bucket, sourceKey, localSource)
    p.log.success(`Uploaded s3://${bucket}/${sourceKey} (${size.toLocaleString()} bytes)`)
  }

  p.outro('Done.')
}
