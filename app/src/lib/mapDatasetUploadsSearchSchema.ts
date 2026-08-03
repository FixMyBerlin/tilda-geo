import { z } from 'zod'
import { optionalSearchString } from '@/lib/searchParamsSchema'
import { offsetSearchFields } from '@/shared/pagination/offsetSearchSchema'

const UPLOAD_KINDS = ['datasets', 'system'] as const
export type UploadKind = (typeof UPLOAD_KINDS)[number]

export const mapDatasetUploadsSearchSchema = z
  .object({
    kind: z.enum(UPLOAD_KINDS).optional(),
    regionSlug: optionalSearchString(),
  })
  .extend(offsetSearchFields({ maxTake: 200 }))

export type MapDatasetUploadsSearch = z.infer<typeof mapDatasetUploadsSearchSchema>

/** Resolve list kind; missing URL param means non-system datasets. */
export function resolveUploadKind(kind: UploadKind | undefined): UploadKind {
  return kind === 'system' ? 'system' : 'datasets'
}
