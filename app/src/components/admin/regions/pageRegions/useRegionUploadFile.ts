import { useUploadFile } from '@better-upload/client'
import {
  regionLogoClientMetadataSchema,
  regionLogoResponseMetadataSchema,
} from '@/server/regions/uploads/regionLogoUpload.schemas'
import {
  REGION_UPLOAD_ACCEPTED_MIME_TYPES,
  REGION_UPLOAD_MAX_FILE_SIZE_BYTES,
} from '@/server/regions/uploads/regionUploadImage.const'

export const REGION_UPLOAD_ACCEPT = REGION_UPLOAD_ACCEPTED_MIME_TYPES.join(',')
export const REGION_UPLOAD_MAX_MB = REGION_UPLOAD_MAX_FILE_SIZE_BYTES / (1024 * 1024)

/** Shared better-upload client for region logo + welcome hero (one server route). */
export function useRegionUploadFile(onUploadId: (uploadId: string) => void) {
  const { uploadAsync, isPending } = useUploadFile({
    api: '/api/admin/region-uploads/upload',
    route: 'regionUpload',
    onError: (error) => {
      alert(error instanceof Error ? error.message : String(error))
    },
    onUploadComplete: ({ metadata }) => {
      const { regionUploadId } = regionLogoResponseMetadataSchema.parse(metadata)
      onUploadId(String(regionUploadId))
    },
  })

  const uploadRegionFile = (file: File, region: { regionId: number; regionSlug: string }) => {
    if (file.size > REGION_UPLOAD_MAX_FILE_SIZE_BYTES) {
      alert(`Die Datei ist zu groß (max. ${REGION_UPLOAD_MAX_MB} MB).`)
      return Promise.resolve(false)
    }
    return uploadAsync(file, {
      metadata: regionLogoClientMetadataSchema.parse(region),
    }).then(
      () => true,
      () => false,
    )
  }

  return { uploadRegionFile, isPending }
}
