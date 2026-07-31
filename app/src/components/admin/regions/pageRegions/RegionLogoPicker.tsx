import { useUploadFile } from '@better-upload/client'
import type { FormApi } from '@/components/shared/form/types'
import type { RegionFormInput } from '@/server/regions/regionWriteSchema'
import {
  regionLogoClientMetadataSchema,
  regionLogoResponseMetadataSchema,
} from '@/server/regions/uploads/regionLogoUpload.schemas'

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
  const { uploadAsync, isPending } = useUploadFile({
    api: '/api/admin/region-uploads/upload',
    route: 'regionLogo',
    onUploadComplete: ({ metadata }) => {
      // better-upload types client metadata as Record<string, unknown>; parse the shared schema.
      const { regionUploadId } = regionLogoResponseMetadataSchema.parse(metadata)
      form.setFieldValue('headerLogoId', String(regionUploadId))
    },
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
                <input
                  type="file"
                  accept="image/svg+xml,image/png,image/jpeg"
                  disabled={isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      void uploadAsync(file, {
                        metadata: regionLogoClientMetadataSchema.parse({
                          regionSlug,
                          regionId,
                        }),
                      })
                    }
                    event.target.value = ''
                  }}
                  className="text-sm"
                />
                {isPending ? <span className="text-sm text-gray-500">Lädt hoch…</span> : null}
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
