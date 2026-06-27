import { basename } from 'node:path'
import { originalFilePath } from '../steps/download'
import { params } from '../utils/parameters'
import { isDev } from './isDev'

export async function checkSkipDownload() {
  const fileName = basename(params.pbfDownloadUrl)
  const filePath = originalFilePath(fileName)
  const fileExists = await Bun.file(filePath).exists()

  if (isDev) {
    console.log(
      'checkSkipDownload:',
      JSON.stringify({
        fileExists,
        paramSkipDownload: params.skipDownload,
      }),
    )
  }

  // Only the original download satisfies SKIP_DOWNLOAD — profile PBFs are derived from it.
  return {
    fileName,
    fileExists,
    filePath,
    skipDownload: fileExists && params.skipDownload,
  }
}
