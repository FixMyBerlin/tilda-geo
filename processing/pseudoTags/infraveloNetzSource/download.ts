import { join } from 'node:path'
import { $ } from 'bun'
import { PSEUDO_TAGS_DATA } from '../../constants/directories.const'
import { humanFileSize } from '../../utils/humanFileSize'
import { params } from '../../utils/parameters'

const LOG_PREFIX = '[Pseudo Tags][Radnetz Berlin]'
const SOURCE_URL =
  'https://raw.githubusercontent.com/FixMyBerlin/infravelo-radnetz/main/tilda-pseudo-tags/infravelo-netz.csv'

/**
 * Downloads the Radnetz Berlin CSV from the infravelo-radnetz repo on every run (a few hundred KB).
 * A failed download never stops the processing; the file from the last run is used, or none.
 * `fixed` keeps the CSV from the reference run.
 */
export async function downloadInfraveloNetz() {
  const csvDestPath = join(PSEUDO_TAGS_DATA, 'infravelo_netz.csv')
  await $`mkdir -p ${PSEUDO_TAGS_DATA}`

  if (params.diffingMode === 'fixed') {
    console.log(`${LOG_PREFIX} fixed mode: reusing the CSV from the reference run (no download).`)
    return
  }

  try {
    const response = await fetch(SOURCE_URL)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    await Bun.write(csvDestPath, await response.arrayBuffer())
    const { size } = await Bun.file(csvDestPath).stat()
    console.log(`${LOG_PREFIX} Download finished`, humanFileSize(size), SOURCE_URL)
  } catch (error) {
    const fallback = (await Bun.file(csvDestPath).exists())
      ? 'using the file from the last run'
      : 'continuing without it'
    console.warn(`${LOG_PREFIX} WARN: download failed, ${fallback}.`, error)
  }
}
