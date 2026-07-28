import { join } from 'node:path'
import { HASH_DIR } from '../constants/directories.const'

/** Flat filename under HASH_DIR so parent/child source paths never collide (e.g. topic dir vs pseudo_tags subdir). */
const hashPath = (id: string) => join(HASH_DIR, id.replace(/^\/+/, '').replaceAll('/', '__'))

export async function readHashFromFile(pathAsFilename: string) {
  const file = Bun.file(hashPath(pathAsFilename))
  if (await file.exists()) {
    return file.text()
  }
  return ''
}

export async function writeHashForFile(pathAsFilename: string, data: string) {
  const file = Bun.file(hashPath(pathAsFilename))
  return Bun.write(file, data)
}
