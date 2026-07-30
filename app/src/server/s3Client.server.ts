import { aws } from '@better-upload/server/clients'

export function getConfiguredS3Client() {
  return aws({
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
    region: process.env.S3_REGION,
  })
}
