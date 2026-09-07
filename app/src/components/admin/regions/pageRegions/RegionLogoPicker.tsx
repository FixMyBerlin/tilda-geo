import { FileUploadButton } from '@/components/shared/form/fields/FileUploadButton'
import type { FormApi } from '@/components/shared/form/types'
import type { RegionFormInput } from '@/server/regions/regionWriteSchema'
import { REGION_UPLOAD_ACCEPT } from '@/server/regions/uploads/regionUploadImage.const'
import { useRegionUploadFile } from './useRegionUploadFile'

type Props = {
  form: FormApi<RegionFormInput>
  /** Required to upload (RegionUpload.regionId). Absent on the create page → upload disabled. */
  regionId?: number
  regionSlug?: string
}

/**
 * Header-logo control: uploads to the region's RegionUpload library (better-upload) and sets the
 * form's `headerLogoId`. Preview + remove. Upload needs an existing region (create page → hint).
 */
export function RegionLogoPicker({ form, regionId, regionSlug }: Props) {
  const { uploadRegionFile, isPending } = useRegionUploadFile((uploadId) => {
    form.setFieldValue('headerLogoId', uploadId)
  })

  return (
    <form.Field name="headerLogoId">
      {(field) => {
        const currentId = field.state.value
        return (
          <div className="space-y-2">
            {currentId ? (
              <img
                src={`/api/region-uploads/${currentId}/logo`}
                alt="Region-Logo"
                className="h-16 w-auto rounded border border-gray-200 bg-white p-1"
              />
            ) : (
              <p className="text-sm text-gray-500">Kein hochgeladenes Logo ausgewählt.</p>
            )}

            {regionId != null && regionSlug ? (
              <div className="flex flex-wrap items-center gap-3">
                <FileUploadButton
                  id="region-logo-upload"
                  accept={REGION_UPLOAD_ACCEPT}
                  label={currentId ? 'Logo ersetzen' : 'Logo hochladen'}
                  isPending={isPending}
                  onFile={(file) => {
                    void uploadRegionFile(file, { regionSlug, regionId })
                  }}
                />
                {currentId ? (
                  <button
                    type="button"
                    onClick={() => field.handleChange('')}
                    className="text-sm text-red-700 underline"
                  >
                    Logo entfernen
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Region zuerst speichern, dann das Logo auf der Bearbeiten-Seite hochladen.
              </p>
            )}
          </div>
        )
      }}
    </form.Field>
  )
}
