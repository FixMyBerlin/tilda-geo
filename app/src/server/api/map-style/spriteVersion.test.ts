import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { computeSpriteVersion } from '@/scripts/map-style/spriteVersion'
import { SPRITE_VERSION } from './spriteVersion.const'

describe('sprite version', () => {
  test('matches the sprite files in public/map-style', () => {
    expect(SPRITE_VERSION, 'Run `bun run map-sprite-build` and commit the result').toBe(
      computeSpriteVersion(),
    )
  })

  test('changes with the sprite files, not with other files in the folder', () => {
    const folder = mkdtempSync(path.join(tmpdir(), 'sprite-version-'))
    writeFileSync(path.join(folder, 'sprite.png'), 'a')
    const before = computeSpriteVersion(folder)

    writeFileSync(path.join(folder, '.DS_Store'), 'finder')
    expect(computeSpriteVersion(folder)).toBe(before)

    writeFileSync(path.join(folder, 'sprite.png'), 'b')
    expect(computeSpriteVersion(folder)).not.toBe(before)
  })
})
