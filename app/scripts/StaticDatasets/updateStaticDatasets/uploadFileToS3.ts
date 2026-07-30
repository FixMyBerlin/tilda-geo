import fs from 'node:fs'
import path from 'node:path'
import { putObject } from '@better-upload/server/helpers'
import type { EnvironmentValues } from '@/server/envSchema'
import { getConfiguredS3Client } from '@/server/s3Client.server'
import { S3_UPLOAD_FOLDER_BY_APP_ENV } from '@/server/s3UploadEnvFolder.const'
import { s3VirtualHostedUrl } from '@/server/s3VirtualHostedUrl.server'
import { getValidatedEnv, staticDatasetsS3CredentialsSchema } from '../../shared/env'
import { red } from '../utils/log'

/** @returns URL of pmtile on S3 */
export const uploadFileToS3 = async (
  uploadFullFilename: string,
  datasetFolder: string,
  appEnv: EnvironmentValues,
) => {
  const env = getValidatedEnv(staticDatasetsS3CredentialsSchema)
  const s3UploadFolder = S3_UPLOAD_FOLDER_BY_APP_ENV[appEnv]

  const fileKey = `uploads/${s3UploadFolder}/${datasetFolder}/${path.parse(uploadFullFilename).base}`
  try {
    await putObject(getConfiguredS3Client(), {
      bucket: env.S3_BUCKET,
      key: fileKey,
      body: new Uint8Array(fs.readFileSync(uploadFullFilename)),
      contentType: 'application/octet-stream',
    })
  } catch (e: unknown) {
    red(`  ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  }

  return s3VirtualHostedUrl({ bucket: env.S3_BUCKET, key: fileKey, region: env.S3_REGION })
}
