import { describe, expect, test } from 'vitest'
import {
  REGION_UPLOAD_CONTENT_BASE64_MAX_CHARS,
  regionUploadFromBytesInputSchema,
} from './regionUploadFromBytes.schema'

describe('regionUploadFromBytesInputSchema', () => {
  const valid = {
    regionSlug: 'demo',
    filename: 'x.png',
    mimeType: 'image/png' as const,
    contentBase64: 'aGVsbG8=',
  }

  test('accepts a small payload', () => {
    expect(regionUploadFromBytesInputSchema.safeParse(valid).success).toBe(true)
  })

  test('rejects contentBase64 above encoded size cap before decode', () => {
    const result = regionUploadFromBytesInputSchema.safeParse({
      ...valid,
      contentBase64: 'A'.repeat(REGION_UPLOAD_CONTENT_BASE64_MAX_CHARS + 1),
    })
    expect(result.success).toBe(false)
  })
})
