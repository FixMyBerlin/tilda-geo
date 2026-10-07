import { describe, expect, test } from 'vitest'
import {
  PrivateBackgroundConfigSchema,
  PrivateBackgroundUpdateSchema,
} from './privateBackgroundSchema'

const valid = {
  slug: 'berlin-dop',
  name: 'Berlin DOP',
  tilesUrl: 'https://tiles.example.com/{z}/{x}/{y}.jpg?token=abc',
}

describe('PrivateBackgroundConfigSchema', () => {
  test('accepts an XYZ URL with a token and fills the defaults', () => {
    expect(PrivateBackgroundConfigSchema.parse(valid)).toMatchObject({
      attributionHtml: '',
      minzoom: null,
      maxzoom: null,
      tileSize: 256,
      regionSlugs: [],
    })
  })

  test.each([
    'http://tiles.example.com/{z}/{x}/{y}.jpg',
    'https://tiles.example.com/{z}/{x}.jpg',
    'https://tiles.example.com/{z}/{x}/{y}.jpg?token=a b',
  ])('rejects tile URL %s', (tilesUrl) => {
    expect(PrivateBackgroundConfigSchema.safeParse({ ...valid, tilesUrl }).success).toBe(false)
  })

  test('update may omit the tile URL but not send an invalid one', () => {
    const { tilesUrl: _tilesUrl, ...withoutUrl } = valid
    expect(PrivateBackgroundUpdateSchema.safeParse(withoutUrl).success).toBe(true)
    expect(PrivateBackgroundUpdateSchema.safeParse({ ...valid, tilesUrl: 'x' }).success).toBe(false)
  })
})
