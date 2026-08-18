import type { REGION_UPLOAD_ACCEPTED_MIME_TYPES } from '@/server/regions/uploads/regionUploadImage.const'

type AcceptedMimeType = (typeof REGION_UPLOAD_ACCEPTED_MIME_TYPES)[number]

const hasBytesAt = (body: Uint8Array, offset: number, signature: number[]) =>
  signature.every((byte, index) => body[offset + index] === byte)

const isPng = (body: Uint8Array) =>
  hasBytesAt(body, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const isJpeg = (body: Uint8Array) => hasBytesAt(body, 0, [0xff, 0xd8, 0xff])
const isWebp = (body: Uint8Array) =>
  hasBytesAt(body, 0, [0x52, 0x49, 0x46, 0x46]) && hasBytesAt(body, 8, [0x57, 0x45, 0x42, 0x50])
/** SVG is text, so there is no magic number — require an `<svg>` root near the start. */
const isSvg = (body: Uint8Array) =>
  /<svg[\s/>]/i.test(new TextDecoder().decode(body.subarray(0, 1024)))

const matchesMimeType: Record<AcceptedMimeType, (body: Uint8Array) => boolean> = {
  'image/png': isPng,
  'image/jpeg': isJpeg,
  'image/webp': isWebp,
  'image/svg+xml': isSvg,
}

/**
 * SVG from our own origin executes scripts on direct navigation (`nosniff` does not help for a
 * correctly typed SVG), so a leaked admin API token could plant stored XSS via a region logo.
 * Logos and welcome images never need scripting.
 */
const svgScriptPatterns = [/<script[\s/>]/i, /\son[a-z]+\s*=/i, /javascript:/i]

/**
 * Bearer/MCP callers send `mimeType` and the bytes independently (unlike the browser upload, where
 * the type comes from the file). Verify the bytes really are the declared image type so the API
 * cannot store arbitrary payloads behind an image content type.
 */
export function assertRegionUploadBytes(mimeType: AcceptedMimeType, body: Uint8Array) {
  if (!matchesMimeType[mimeType](body)) {
    throw new Error(`Dateiinhalt passt nicht zum MIME-Typ ${mimeType}`)
  }

  if (mimeType === 'image/svg+xml') {
    const svg = new TextDecoder().decode(body)
    if (svgScriptPatterns.some((pattern) => pattern.test(svg))) {
      throw new Error('SVG mit Skript-Inhalten wird nicht akzeptiert')
    }
  }
}
