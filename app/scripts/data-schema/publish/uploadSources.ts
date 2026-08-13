import * as p from '@clack/prompts'
import { putS3File } from '@/server/dataSchema/dataSchemaS3.server'
import { dataSchemaSpecKey } from '@/server/dataSchema/dataSchemaS3Keys'

export async function uploadSpecJson(table: string, specPath: string) {
  const specKey = dataSchemaSpecKey(table)
  await putS3File(specKey, specPath, 'application/json')
  p.log.success(`Uploaded ${specKey}`)
  return specKey
}
