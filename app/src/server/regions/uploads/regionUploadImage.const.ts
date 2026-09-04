/** Shared client + server limits for region logo and welcome hero uploads. */
export const REGION_UPLOAD_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const REGION_UPLOAD_MAX_MB = REGION_UPLOAD_MAX_FILE_SIZE_BYTES / (1024 * 1024)
export const REGION_UPLOAD_ACCEPTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const

type AcceptedMimeType = (typeof REGION_UPLOAD_ACCEPTED_MIME_TYPES)[number]

/**
 * Canonical MIME → extensions. The file-input `accept` attribute uses extensions, not MIME
 * types (same as Trassenscout `getAcceptAttribute`).
 */
export const REGION_UPLOAD_MIME_TO_EXTENSIONS = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
} as const satisfies Record<AcceptedMimeType, readonly string[]>

export const REGION_UPLOAD_ACCEPT = Object.values(REGION_UPLOAD_MIME_TO_EXTENSIONS).flat().join(',')
