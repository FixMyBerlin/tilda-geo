import { join } from 'path'
import { HASH_DIR } from '../constants/directories.const'

const hashPath = (id: string) => join(HASH_DIR, id)

export async function readHashFromFile(pathAsFilename: string) {
  const file = await Bun.file(hashPath(pathAsFilename))
  if (await file.exists()) {
    return file.text()
  }
  return ''
}

export async function writeHashForFile(pathAsFilename: string, data: string) {
  const file = await Bun.file(hashPath(pathAsFilename))
  return Bun.write(file, data)
}
