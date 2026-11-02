import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

export const SPRITE_FOLDER = path.join(import.meta.dirname, '../../public/map-style')

/** The files `buildSprite.ts` writes. Skips `.gitkeep`, `.DS_Store` and the like. */
const isSpriteFile = (name: string) => /^sprite(@\dx)?\.(png|json)$/.test(name)

/** Short hash of the built sprite files. `/api/map-style` adds it to the sprite URL as `?v=`. */
export const computeSpriteVersion = (folder = SPRITE_FOLDER) => {
  const hash = createHash('sha256')
  for (const file of readdirSync(folder).filter(isSpriteFile).sort()) {
    hash.update(readFileSync(path.join(folder, file)))
  }
  return hash.digest('hex').slice(0, 10)
}
