/** Shared client + server limits for region logo and welcome hero uploads. */
export const REGION_UPLOAD_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const REGION_UPLOAD_ACCEPTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const
