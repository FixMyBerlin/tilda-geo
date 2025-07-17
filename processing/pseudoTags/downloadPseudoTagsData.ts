import { $ } from 'bun'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { PSEUDO_TAGS_DATA } from '../constants/directories.const'
import { directoryHasChanged, updateDirectoryHash } from '../utils/hashing'
import { humanFileSize } from '../utils/humanFileSize'
import { isSidepathNoSource, mapillaryCoverageSource } from './mapillaryCoverageSource/source.const'

export const downloadPseudoTagsData = async () => {
  await handleMapillaryCoverage()
  await handleIsSidepathNo()

  return true
}

async function handleIsSidepathNo() {
  console.log('Initialize: Pseudo Tags')
  const sourceDir = join(import.meta.dir, './isSidepathNoSource')
  const dataDir = join(PSEUDO_TAGS_DATA, './isSidepathNoData')

  await $`mkdir -p ${dataDir}`

  const sourceChanged = await directoryHasChanged(sourceDir)
  const dataChanged = await directoryHasChanged(dataDir)

  if (sourceChanged || dataChanged) {
    console.log(
      'Pseudo Tags: Downloading Is Sidepath No',
      JSON.stringify({
        isSidepathNoSource,
        dataChanged,
        sourceChanged,
      }),
    )
    // Ensure data directory exists
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
    // Download CSV using Bun
    const res = await fetch(isSidepathNoSource)
    if (!res.ok) throw new Error('Failed to download Is Sidepath No CSV')
    const destPath = join(dataDir, 'is_sidepath_no.csv')
    await Bun.write(destPath, await res.arrayBuffer())
    // Get file size for logging
    const { size } = await Bun.file(destPath).stat()

    // Update hash after download
    await updateDirectoryHash(dataDir)
    await updateDirectoryHash(sourceDir)
    console.log('Pseudo Tags: Pseudo tags data for Is Sidepath No downloaded.', humanFileSize(size))
  } else {
    console.log(
      'Pseudo Tags: ⏩ Skipping download – Is Sidepath No source and data did not change.',
    )
  }
}

async function handleMapillaryCoverage() {
  console.log('Initialize: Pseudo Tags')
  const sourceDir = join(import.meta.dir, './mapillaryCoverageSource')
  const dataDir = join(PSEUDO_TAGS_DATA, './mapillaryCoverageData')

  await $`mkdir -p ${dataDir}`

  const sourceChanged = await directoryHasChanged(sourceDir)
  const dataChanged = await directoryHasChanged(dataDir)

  if (sourceChanged || dataChanged) {
    console.log(
      'Pseudo Tags: Downloading Mapillary Coverage',
      JSON.stringify({
        mapillaryCoverageSource,
        dataChanged,
        sourceChanged,
      }),
    )
    // Ensure data directory exists
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
    // Download CSV using Bun
    const res = await fetch(mapillaryCoverageSource)
    if (!res.ok) throw new Error('Failed to download Mapillary coverage CSV')
    const destPath = join(dataDir, 'mapillary_coverage.csv')
    await Bun.write(destPath, await res.arrayBuffer())
    // Get file size for logging
    const { size } = await Bun.file(destPath).stat()

    // Update hash after download
    await updateDirectoryHash(dataDir)
    await updateDirectoryHash(sourceDir)
    console.log(
      'Pseudo Tags: Pseudo tags data for Mapillary coverage downloaded.',
      humanFileSize(size),
    )
  } else {
    console.log(
      'Pseudo Tags: ⏩ Skipping download – Mapillary coverage source and data did not change.',
    )
  }
}
