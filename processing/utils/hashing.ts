import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readHashFromFile, writeHashForFile } from './persistentData'
import { $ } from './sh'

/**
 * Compute the hash(es) of a directory. It iterates all files recursively and sorts them before hashing.
 * @param path The path to the directory
 * @returns The hash of the directory
 */
async function computeDirectoryHash(path: string) {
  try {
    // Reimplements `find "<dir>" -type f | sort | xargs shasum` without a shell pipe:
    // collect every file recursively, sort the paths, then hand them all to `shasum`.
    const entries = await readdir(path, { recursive: true, withFileTypes: true })
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name))
      .sort()
    if (files.length === 0) return ''
    const hash = await $`shasum ${files}`.quiet().text()
    return hash
  } catch (error) {
    throw new Error(`Could not compute the hash of the directory "${path}": ${error}`)
  }
}

/**
 * Save the directorys hash on the disk.
 * @param path The path to the directory
 */
export async function updateDirectoryHash(path: string) {
  return writeHashForFile(path, await computeDirectoryHash(path))
}

/**
 * Compare the saved hash with the current hash of the directory.
 * @param path The path to the directory
 * @returns
 */
export async function directoryHasChanged(path: string) {
  const oldHash = await readHashFromFile(path)
  const newHash = await computeDirectoryHash(path)
  return oldHash !== newHash
}
