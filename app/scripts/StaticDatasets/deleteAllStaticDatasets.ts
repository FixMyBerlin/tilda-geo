// We use bun.sh to run this file
import { deleteAllUploads } from './api'
import { inverse, yellow } from './utils/log'

export const deleteUploadFolderOnS3 = () => {
  yellow('  Not implemented.')
}

inverse('Deleting all datasets...')

console.log(`  Deleting S3 folder...`)
deleteUploadFolderOnS3()

console.log(`  Deleting DB entries...`)
await deleteAllUploads()

inverse('DONE')
