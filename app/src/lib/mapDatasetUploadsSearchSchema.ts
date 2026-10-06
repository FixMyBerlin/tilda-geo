import { z } from 'zod'
import { optionalSearchString } from '@/lib/searchParamsSchema'
import { createPageSearchSchema } from '@/shared/pagination/pageSearchSchema'

const UPLOAD_KINDS = ['datasets', 'system'] as const
export type UploadKind = (typeof UPLOAD_KINDS)[number]

export const mapDatasetUploadsSearchSchema = z
  .object({
    kind: z.enum(UPLOAD_KINDS).optional().catch(undefined),
    regionSlug: optionalSearchString().catch(undefined),
    q: optionalSearchString(),
  })
  .extend(createPageSearchSchema().shape)

export type MapDatasetUploadsSearchInput = z.input<typeof mapDatasetUploadsSearchSchema>

/** Resolve list kind; missing URL param means non-system datasets. */
export function resolveUploadKind(kind: UploadKind | undefined): UploadKind {
  return kind === 'system' ? 'system' : 'datasets'
}
