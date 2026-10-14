import type { ReviewEntrySource } from '@/prisma/generated/enums'

/** Short label for lists and filters. */
export const REVIEW_ENTRY_SOURCE_LABEL = {
  UPLOAD: 'Upload',
  MANUAL: 'manuell',
  SPACE_FINDER: 'Flächenfinder',
} as const satisfies Record<ReviewEntrySource, string>

/** Sentence start for the entry detail (`{text} vor 2 Stunden von …`). */
export const REVIEW_ENTRY_SOURCE_DETAIL_LABEL = {
  UPLOAD: 'Importiert',
  MANUAL: 'Manuell erstellt',
  SPACE_FINDER: 'Aus Flächenfinder übernommen',
} as const satisfies Record<ReviewEntrySource, string>
