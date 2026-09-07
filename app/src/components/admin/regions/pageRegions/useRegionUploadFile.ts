import { useUploadFile } from '@better-upload/client'
import { toast } from 'sonner'
import { toastError } from '@/components/shared/toast/toastError'
import { normalizeRegionUploadMimeType } from '@/server/regions/uploads/normalizeRegionUploadMimeType'
import {
  regionLogoClientMetadataSchema,
  regionLogoResponseMetadataSchema,
} from '@/server/regions/uploads/regionLogoUpload.schemas'
import {
  REGION_UPLOAD_MAX_FILE_SIZE_BYTES,
  REGION_UPLOAD_MAX_MB,
} from '@/server/regions/uploads/regionUploadImage.const'

const UNSUPPORTED_TYPE_MESSAGE =
  'Dieses Dateiformat wird nicht unterstützt. Erlaubt: PNG, JPEG, WebP, SVG.'

/** Shared better-upload client for region logo + welcome hero (one server route). */
export function useRegionUploadFile(onUploadId: (uploadId: string) => void) {
  const { uploadAsync, isPending } = useUploadFile({
    api: '/api/admin/region-uploads/upload',
    route: 'regionUpload',
    onError: toastError,
    onUploadComplete: ({ metadata }) => {
      const { regionUploadId } = regionLogoResponseMetadataSchema.parse(metadata)
      onUploadId(String(regionUploadId))
    },
  })

  const uploadRegionFile = (file: File, region: { regionId: number; regionSlug: string }) => {
    if (file.size > REGION_UPLOAD_MAX_FILE_SIZE_BYTES) {
      toast.error(`Die Datei ist zu groß (max. ${REGION_UPLOAD_MAX_MB} MB).`)
      return Promise.resolve(false)
    }
    const mimeType = normalizeRegionUploadMimeType(file.type, file.name)
    if (!mimeType) {
      toast.error(UNSUPPORTED_TYPE_MESSAGE)
      return Promise.resolve(false)
    }
    const uploadFile =
      file.type === mimeType
        ? file
        : new File([file], file.name, { type: mimeType, lastModified: file.lastModified })
    return uploadAsync(uploadFile, {
      metadata: regionLogoClientMetadataSchema.parse(region),
    }).then(
      () => true,
      () => false,
    )
  }

  return { uploadRegionFile, isPending }
}
