import {
  REGION_UPLOAD_ACCEPTED_MIME_TYPES,
  REGION_UPLOAD_MIME_TO_EXTENSIONS,
} from '@/server/regions/uploads/regionUploadImage.const'

type AcceptedMimeType = (typeof REGION_UPLOAD_ACCEPTED_MIME_TYPES)[number]

const ACCEPTED_MIME_TYPES = new Set<string>(REGION_UPLOAD_ACCEPTED_MIME_TYPES)

/** Browser / OS aliases that Better Upload would reject against the canonical allowlist. */
const MIME_ALIASES = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
} as const satisfies Record<string, AcceptedMimeType>

const EXTENSION_TO_MIME = Object.fromEntries(
  Object.entries(REGION_UPLOAD_MIME_TO_EXTENSIONS).flatMap(([mime, extensions]) =>
    extensions.map((extension) => [extension, mime]),
  ),
) as Record<string, AcceptedMimeType>

function extensionOf(filename: string) {
  const basename = filename.split(/[/\\]/).pop() ?? ''
  const dot = basename.lastIndexOf('.')
  if (dot < 0) return ''
  return basename.slice(dot).toLowerCase()
}

/**
 * Map a browser `File.type` (+ filename) to a canonical allowlist MIME.
 * `image/jpg` / empty type + `.jpg` become `image/jpeg`; unknown types stay rejected.
 */
export function normalizeRegionUploadMimeType(mimeType: string, filename: string) {
  const trimmed = mimeType.trim().toLowerCase()
  if (ACCEPTED_MIME_TYPES.has(trimmed)) {
    return trimmed as AcceptedMimeType
  }

  if (trimmed in MIME_ALIASES) {
    return MIME_ALIASES[trimmed as keyof typeof MIME_ALIASES]
  }

  if (!trimmed) {
    const fromExtension = EXTENSION_TO_MIME[extensionOf(filename)]
    return fromExtension ?? null
  }

  return null
}
