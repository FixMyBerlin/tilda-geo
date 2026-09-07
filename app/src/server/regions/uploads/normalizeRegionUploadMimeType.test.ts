import { describe, expect, test } from 'vitest'
import { normalizeRegionUploadMimeType } from './normalizeRegionUploadMimeType'
import { REGION_UPLOAD_ACCEPT } from './regionUploadImage.const'

describe('normalizeRegionUploadMimeType', () => {
  test('keeps canonical allowlist types', () => {
    expect(normalizeRegionUploadMimeType('image/jpeg', 'logo.jpg')).toBe('image/jpeg')
    expect(normalizeRegionUploadMimeType('image/png', 'logo.png')).toBe('image/png')
    expect(normalizeRegionUploadMimeType('image/webp', 'logo.webp')).toBe('image/webp')
    expect(normalizeRegionUploadMimeType('image/svg+xml', 'logo.svg')).toBe('image/svg+xml')
  })

  test('maps jpeg aliases to image/jpeg', () => {
    expect(normalizeRegionUploadMimeType('image/jpg', 'logo.jpg')).toBe('image/jpeg')
    expect(normalizeRegionUploadMimeType('image/pjpeg', 'logo.jpg')).toBe('image/jpeg')
    expect(normalizeRegionUploadMimeType('IMAGE/JPG', 'logo.jpg')).toBe('image/jpeg')
  })

  test('infers type from extension when the browser leaves File.type empty', () => {
    expect(normalizeRegionUploadMimeType('', 'logo.jpg')).toBe('image/jpeg')
    expect(normalizeRegionUploadMimeType('', 'logo.JPG')).toBe('image/jpeg')
    expect(normalizeRegionUploadMimeType('', 'path/to/logo.jpeg')).toBe('image/jpeg')
    expect(normalizeRegionUploadMimeType('', 'logo.png')).toBe('image/png')
    expect(normalizeRegionUploadMimeType('', 'logo.webp')).toBe('image/webp')
    expect(normalizeRegionUploadMimeType('', 'logo.svg')).toBe('image/svg+xml')
  })

  test('rejects unknown types even when the extension looks like an image', () => {
    expect(normalizeRegionUploadMimeType('image/gif', 'logo.gif')).toBeNull()
    expect(normalizeRegionUploadMimeType('image/gif', 'logo.jpg')).toBeNull()
    expect(normalizeRegionUploadMimeType('', 'logo.gif')).toBeNull()
    expect(normalizeRegionUploadMimeType('', 'logo')).toBeNull()
  })
})

describe('REGION_UPLOAD_ACCEPT', () => {
  test('is extension-only so the file picker matches .jpg as well as .jpeg', () => {
    expect(REGION_UPLOAD_ACCEPT).toBe('.png,.jpg,.jpeg,.webp,.svg')
  })
})
