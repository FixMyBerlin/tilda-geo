import fs from 'node:fs'
import path from 'node:path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getValidatedEnv, staticDatasetsS3Schema } from '../../shared/env'
import { red } from '../utils/log'

/** @returns URL of pmtile on S3 */
export const uploadFileToS3 = async (uploadFullFilename: string, datasetFolder: string) => {
  const env = getValidatedEnv(staticDatasetsS3Schema)

  const s3Client = new S3Client({
    credentials: { accessKeyId: env.S3_KEY, secretAccessKey: env.S3_SECRET },
    region: env.S3_REGION,
  })

  const remoteFilename = `${datasetFolder}/${path.parse(uploadFullFilename).base}`
  const fileKey = `uploads/${env.S3_UPLOAD_FOLDER}/${remoteFilename}`
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: fileKey,
        Body: fs.readFileSync(uploadFullFilename),
      }),
    )
  } catch (e) {
    red(`  ${e.message}`)
    process.exit(1)
  }

  return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${fileKey}`
}
