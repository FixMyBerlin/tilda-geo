import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { HASH_DIR } from '../constants/directories.const'

const hashPath = (id: string) => join(HASH_DIR, id)

export async function readHashFromFile(pathAsFilename: string) {
  const p = hashPath(pathAsFilename)
  if (existsSync(p)) {
    return readFile(p, 'utf8')
  }
  return ''
}

export async function writeHashForFile(pathAsFilename: string, data: string) {
  const p = hashPath(pathAsFilename)
  await mkdir(dirname(p), { recursive: true })
  return writeFile(p, data)
}
