import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import type { SpritesmithResult } from 'spritesmith'
import Spritesmith from 'spritesmith'
import type { SpriteSource } from './process'
import { log, saveJson, sortObject } from './util'

function generateSpriteUrl(sprite: SpriteSource, pixelRatio: 1 | 2, extension: 'png' | 'json') {
  const completeUrl = `${sprite.url}${pixelRatio === 1 ? '' : '@2x'}.${extension}`
  const url = new URL(completeUrl)
  if (sprite.searchParams) {
    Object.entries(sprite.searchParams).forEach(([name, value]) => {
      url.searchParams.append(name, String(value))
    })
  }
  return url.toString()
}

async function fetchResponse(sprite: SpriteSource, pixelRatio: 1 | 2, extension: 'png' | 'json') {
  const url = generateSpriteUrl(sprite, pixelRatio, extension)
  log(`Fetching ${extension}`, url)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }
  return response
}

export async function mergeSprites(sprites: SpriteSource[], pixelRatio: 1 | 2) {
  // Setup temp folder to store single sprite images in
  const tmpFolder = path.join(__dirname, 'tmp/icons')
  fs.rmSync(tmpFolder, { recursive: true, force: true })
  fs.mkdirSync(tmpFolder)

  type SpriteJson = Record<
    string,
    { x: number; y: number; width: number; height: number; pixelRatio: number }
  >

  // Extract single images from a given sprite and store them in a temporary folder
  const iconFiles: Record<string, string> = {}
  const extractIcons = async (imageBuffer, coordinates: SpriteJson) => {
    // Use the `skipList` to remove alls files from the sprite that start with the given term
    const skipList = [
      'us-',
      'london-',
      'il-',
      // 'jp-', // needed for 'jp-expressway-2'
      'in-',
      'kr-',
      'philadelphia-',
      'ae-',
      'al-',
      'gp-',
      'kiev-',
      'mexico-',
      'milan-',
    ]
    let skipCount = 0
    for (const [key, position] of Object.entries(coordinates)) {
      if (skipList.some((term) => key.startsWith(term))) {
        skipCount += 1
        continue
      }
      const { x, y, width, height } = position
      const filename = path.join(tmpFolder, `${key}.png`)
      await sharp(imageBuffer).extract({ left: x, top: y, width, height }).toFile(filename)
      iconFiles[key] = filename
    }
    console.log(
      `INFO extractIcons: ${skipCount} icons skipped with skipList ${skipList.join(', ')}`,
    )
  }

  // For each SpriteSource: Download the sprite and spriteJson and call `extractIcons`
  for (const sprite of sprites) {
    const imageResponse = await fetchResponse(sprite, pixelRatio, 'png')
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    const coordinateResponse = await fetchResponse(sprite, pixelRatio, 'json')
    const coordinates = await coordinateResponse.json()
    await extractIcons(imageBuffer, coordinates)
  }

  const iconFilenameToKey = Object.fromEntries(
    Object.entries(iconFiles).map(([key, fileName]) => [fileName, key]),
  )

  // Create a single merged sprite
  const mergedSpritePath = `public/map-style/sprite${pixelRatio === 1 ? '' : '@2x'}`
  log('Create merged sprite', mergedSpritePath)

  const spriteResult: SpritesmithResult = await new Promise((resolve, reject) => {
    const sortedIconFiles = sortObject(iconFiles)
    Spritesmith.run({ src: Object.values(sortedIconFiles) }, (err, result) => {
      if (err) {
        console.error('ERROR in Spritesmith.run', Object.values(sortedIconFiles))
        reject()
        throw err
      }
      resolve(result)
    })
  })

  // Create and store the merged sprite PNG
  await sharp(spriteResult.image).toFile(`${mergedSpritePath}.png`)

  // Create and store the merged sprite JSON
  const coordinates: SpriteJson = Object.fromEntries(
    Object.entries(spriteResult.coordinates).map(([spriteFilename, coords]) => [
      iconFilenameToKey[spriteFilename],
      coords,
    ]),
  )
  Object.values(coordinates).forEach((coords) => {
    coords.pixelRatio = pixelRatio
  })
  const sortedCoordinates = sortObject(coordinates)
  await saveJson(`${mergedSpritePath}.json`, sortedCoordinates)

  log('END: mergeSprites finished', { mergedSpritePath, pixelRatio })
}
