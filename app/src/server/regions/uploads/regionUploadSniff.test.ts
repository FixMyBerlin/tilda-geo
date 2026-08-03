import { describe, expect, test } from 'vitest'
import { assertRegionUploadBytes } from './regionUploadSniff'

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from('WEBPVP8 '),
])

describe('assertRegionUploadBytes', () => {
  test('accepts bytes matching the declared type', () => {
    expect(() => assertRegionUploadBytes('image/png', PNG)).not.toThrow()
    expect(() => assertRegionUploadBytes('image/jpeg', JPEG)).not.toThrow()
    expect(() => assertRegionUploadBytes('image/webp', WEBP)).not.toThrow()
    expect(() =>
      assertRegionUploadBytes(
        'image/svg+xml',
        Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><rect /></svg>'),
      ),
    ).not.toThrow()
  })

  test('rejects bytes that do not match the declared type', () => {
    expect(() => assertRegionUploadBytes('image/png', Buffer.from('<html>hi</html>'))).toThrow(
      /passt nicht/,
    )
    expect(() => assertRegionUploadBytes('image/svg+xml', PNG)).toThrow(/passt nicht/)
    expect(() => assertRegionUploadBytes('image/webp', Buffer.from('RIFFxxxxAVI '))).toThrow(
      /passt nicht/,
    )
  })

  test('rejects scripted SVG', () => {
    expect(() =>
      assertRegionUploadBytes(
        'image/svg+xml',
        Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
      ),
    ).toThrow(/Skript/)
    expect(() =>
      assertRegionUploadBytes(
        'image/svg+xml',
        Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)" />'),
      ),
    ).toThrow(/Skript/)
    expect(() =>
      assertRegionUploadBytes(
        'image/svg+xml',
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)" /></svg>',
        ),
      ),
    ).toThrow(/Skript/)
  })
})
