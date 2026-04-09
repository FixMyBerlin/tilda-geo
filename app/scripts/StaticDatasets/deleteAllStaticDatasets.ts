// We use bun.sh to run this file
import { deleteAllUploads } from './api'
import { buildStaticDatasetsApiConfig } from './staticDatasetsAppEnv.const'
import { inverse, yellow } from './utils/log'

export const deleteUploadFolderOnS3 = () => {
  yellow('  Not implemented.')
}

const api = buildStaticDatasetsApiConfig('development')

inverse('Deleting all datasets...')

console.log(`  Deleting S3 folder...`)
deleteUploadFolderOnS3()

console.log(`  Deleting DB entries...`)
await deleteAllUploads(api)

inverse('DONE')
