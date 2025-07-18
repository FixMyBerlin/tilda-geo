import { basename } from 'path'
import { originalFilePath } from '../steps/download'
import { filteredFilePath } from '../steps/filter'
import { params } from '../utils/parameters'
import { isDev } from './isDev'

export async function checkSkipDownload() {
  const fileName = basename(params.pbfDownloadUrl)
  const filePath = originalFilePath(fileName)
  const fileExists = await Bun.file(filePath).exists()
  const filteredFileExists = await Bun.file(filteredFilePath(fileName)).exists()

  if (isDev) {
    console.log(
      'checkSkipDownload:',
      JSON.stringify({
        fileExists,
        filteredFileExists,
        paramSkipDownload: params.skipDownload,
      }),
    )
  }

  // Check if file already exists
  // We also check for the filteredFile because that is the one we actually need; if that is there, this is enough
  return {
    fileName,
    fileExists,
    filePath,
    skipDownload: (fileExists || filteredFileExists) && params.skipDownload,
  }
}
