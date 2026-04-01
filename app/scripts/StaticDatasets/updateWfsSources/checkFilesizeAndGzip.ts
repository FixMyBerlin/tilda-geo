import fs from 'node:fs'

const MIN_SIZE = 10 * 1024 * 1024 // 10 MB in bytes

export const checkFilesizeAndGzip = (file: string) => {
  const filesize = fs.statSync(file).size
  if (filesize >= MIN_SIZE) {
    console.log('  File is bigger then 10MB, compressing')
    Bun.spawnSync(['gzip', '-f', '-9', file], {
      onExit(_proc, exitCode, _signalCode, error) {
        if (exitCode) {
          console.log('exitCode:', exitCode)
        }
        if (error) {
          console.log('error:', error)
        }
      },
    })
    return `${file}.gz`
  } else {
    console.log('  File is smaller than 10MB, doing nothing')
    return file
  }
}
