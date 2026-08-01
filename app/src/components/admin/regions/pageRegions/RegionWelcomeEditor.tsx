import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { useEffect, useRef, useState } from 'react'
import { AdminTrashIconButton } from '@/components/admin/AdminTrashIconButton'
import { MarkdownEditorField } from '@/components/admin/regions/pageRegions/MarkdownEditorField'
import { FileUploadButton } from '@/components/shared/form/fields/FileUploadButton'
import { RadioGroup } from '@/components/shared/form/fields/RadioGroup'
import { TextField } from '@/components/shared/form/fields/TextField'
import type { FormApi } from '@/components/shared/form/types'
import { Markdown } from '@/components/shared/text/Markdown'
import {
  REGION_WELCOME_IMAGE_MAX_ASPECT_RATIO,
  REGION_WELCOME_IMAGE_MIN_ASPECT_RATIO,
  REGION_WELCOME_IMAGE_MIN_WIDTH_PX,
  REGION_WELCOME_IMAGE_RECOMMENDED_WIDTH_PX,
} from '@/server/regions/regionWelcomeImage.const'
import type { RegionFormInput } from '@/server/regions/regionWriteSchema'
import { withSortOrder } from '@/shared/orderedList/assignSortOrder'
import { newClientListKey } from '@/shared/orderedList/clientListKey'
import {
  REGION_UPLOAD_ACCEPT,
  REGION_UPLOAD_MAX_MB,
  useRegionUploadFile,
} from './useRegionUploadFile'

type Props = {
  form: FormApi<RegionFormInput>
  regionId?: number
  regionSlug?: string
}

type WelcomeSection = RegionFormInput['welcomeSections'][number]

const welcomeImageHelpText = `Empfehlung für Rasterbilder: mindestens ${REGION_WELCOME_IMAGE_MIN_WIDTH_PX} px breit (entspricht ${REGION_WELCOME_IMAGE_MIN_WIDTH_PX / 2} px auf Retina-Displays), ideal ${REGION_WELCOME_IMAGE_RECOMMENDED_WIDTH_PX} px; Seitenverhältnis zwischen 3:2 und 16:9. Formate: PNG, JPEG, WebP oder SVG; max. ${REGION_UPLOAD_MAX_MB} MB. Das Bild wird als großes Visual neben dem Willkommenstext angezeigt — ohne Bild erscheint ein Platzhalter.`

const emptySection = (sortOrder: number): WelcomeSection => ({
  title: '',
  bodyMarkdown: '',
  sortOrder,
  _key: newClientListKey(),
})

const isEmptySection = (section: WelcomeSection) => !section.title.trim()

const ensureTrailingEmpty = (sections: WelcomeSection[]) => {
  const normalized = withSortOrder(sections)
  if (normalized.length >= 8) return normalized
  const last = normalized.at(-1)
  if (!last || !isEmptySection(last)) {
    return [...normalized, emptySection(normalized.length)]
  }
  return normalized
}

function updateSectionRow(
  sections: WelcomeSection[],
  index: number,
  patch: Partial<WelcomeSection>,
) {
  return sections.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
}

/** Soft recommendations only — never blocks upload. SVG is skipped (no reliable pixel size). */
async function getWelcomeImageDimensionWarnings(file: File) {
  if (file.type === 'image/svg+xml') return []

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return ['Bild konnte nicht gelesen werden; Abmessungen wurden nicht geprüft.']
  }
  const { width, height } = bitmap
  bitmap.close()

  const warnings: string[] = []
  if (width < REGION_WELCOME_IMAGE_MIN_WIDTH_PX) {
    warnings.push(
      `Empfohlen: mindestens ${REGION_WELCOME_IMAGE_MIN_WIDTH_PX} px Breite (aktuell: ${width} px).`,
    )
  }

  const aspectRatio = width / height
  if (
    aspectRatio < REGION_WELCOME_IMAGE_MIN_ASPECT_RATIO ||
    aspectRatio > REGION_WELCOME_IMAGE_MAX_ASPECT_RATIO
  ) {
    const idealHeightAt16by9 = Math.round(
      REGION_WELCOME_IMAGE_RECOMMENDED_WIDTH_PX / REGION_WELCOME_IMAGE_MAX_ASPECT_RATIO,
    )
    const idealHeightAt3by2 = Math.round(
      REGION_WELCOME_IMAGE_RECOMMENDED_WIDTH_PX / REGION_WELCOME_IMAGE_MIN_ASPECT_RATIO,
    )
    warnings.push(
      `Empfohlen: Seitenverhältnis zwischen 3:2 (${REGION_WELCOME_IMAGE_MIN_ASPECT_RATIO.toFixed(2)}) und 16:9 (${REGION_WELCOME_IMAGE_MAX_ASPECT_RATIO.toFixed(2)}). Aktuell ${aspectRatio.toFixed(2)} bei ${width} × ${height} Pixel. Ideal: ${REGION_WELCOME_IMAGE_RECOMMENDED_WIDTH_PX} × ${idealHeightAt16by9}–${idealHeightAt3by2} Pixel.`,
    )
  }

  return warnings
}

function WelcomeImageEditor({
  form,
  uploadId,
  onUploadIdChange,
  onRemove,
  regionId,
  regionSlug,
}: {
  form: FormApi<RegionFormInput>
  uploadId: string
  onUploadIdChange: (uploadId: string) => void
  onRemove: () => void
  regionId?: number
  regionSlug?: string
}) {
  const shouldFocusAltRef = useRef(false)
  const { uploadRegionFile, isPending } = useRegionUploadFile((nextUploadId) => {
    shouldFocusAltRef.current = true
    onUploadIdChange(nextUploadId)
  })
  const [dimensionWarnings, setDimensionWarnings] = useState<string[]>([])

  useEffect(() => {
    if (!uploadId || !shouldFocusAltRef.current) return
    shouldFocusAltRef.current = false
    document.getElementById('welcomeImageAltText')?.focus()
  }, [uploadId])

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Hero-Bild</p>
      <p className="text-sm text-gray-600">{welcomeImageHelpText}</p>
      {regionId != null && regionSlug ? (
        <FileUploadButton
          id="region-welcome-hero-upload"
          accept={REGION_UPLOAD_ACCEPT}
          label={uploadId ? 'Bild ersetzen' : 'Bild hochladen'}
          isPending={isPending}
          onFile={(file) => {
            void getWelcomeImageDimensionWarnings(file).then((warnings) => {
              setDimensionWarnings(warnings)
              void uploadRegionFile(file, { regionSlug, regionId })
            })
          }}
        />
      ) : (
        <p className="text-sm text-gray-500">Region zuerst speichern, dann Bild hochladen.</p>
      )}
      {dimensionWarnings.length > 0 ? (
        <ul className="space-y-1 text-sm text-amber-800">
          {dimensionWarnings.map((warning) => (
            <li key={warning} className="flex items-start gap-1.5">
              <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {uploadId ? (
        <div className="flex flex-wrap items-end gap-3 rounded border border-gray-200 p-3">
          <img
            src={`/api/region-uploads/${uploadId}/welcome-hero`}
            alt=""
            className="max-h-32 w-auto rounded border border-gray-200 bg-white"
          />
          <div className="min-w-48 flex-1">
            <TextField
              form={form}
              name="welcomeImageAltText"
              label="Bildbeschreibung (Alt-Text)"
              help="Erforderlich, sobald ein Bild gesetzt ist."
            />
          </div>
          <AdminTrashIconButton
            ariaLabel="Bild entfernen"
            onClick={() => {
              setDimensionWarnings([])
              onRemove()
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

function WelcomeSectionsEditor({
  sections,
  onChange,
}: {
  sections: WelcomeSection[]
  onChange: (sections: WelcomeSection[]) => void
}) {
  const rows = ensureTrailingEmpty(sections)

  const commit = (next: WelcomeSection[]) => {
    onChange(ensureTrailingEmpty(withSortOrder(next)))
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        FAQ-Abschnitte (max. 8). Erscheinen hinter dem Link „Häufige Fragen“ im Willkommens-Panel.
      </p>
      {rows.map((section, index) => {
        const isTrailingEmpty = index === rows.length - 1 && isEmptySection(section)
        return (
          <div key={section._key ?? index} className="space-y-2 rounded border border-gray-200 p-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Frage</span>
              <input
                className="rounded border border-gray-300 px-2 py-1"
                value={section.title}
                onChange={(event) =>
                  commit(updateSectionRow(rows, index, { title: event.target.value }))
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Antwort (Markdown)</span>
              <textarea
                className="min-h-24 rounded border border-gray-300 px-2 py-1 font-mono text-sm"
                value={section.bodyMarkdown}
                onChange={(event) =>
                  commit(updateSectionRow(rows, index, { bodyMarkdown: event.target.value }))
                }
              />
            </label>
            {!isTrailingEmpty ? (
              <AdminTrashIconButton
                ariaLabel="Abschnitt entfernen"
                onClick={() => commit(rows.filter((row) => row._key !== section._key))}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function WelcomePreview({ form }: { form: FormApi<RegionFormInput> }) {
  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => {
        if (values.welcomeEnabled !== 'true') {
          return <p className="text-sm text-gray-500">Willkommens-Dialog ist deaktiviert.</p>
        }
        return (
          <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-4">
            {values.welcomeSubtitle ? (
              <p className="text-base/7 font-semibold text-brand">{values.welcomeSubtitle}</p>
            ) : null}
            <h3 className="text-lg font-semibold text-gray-900">
              {values.welcomeTitle || 'Titel'}
            </h3>
            {values.welcomeBodyMarkdown ? (
              <div className="mt-3">
                <Markdown markdown={values.welcomeBodyMarkdown} headingStyle="document" />
              </div>
            ) : null}
            {values.welcomeImageUploadId ? (
              <img
                src={`/api/region-uploads/${values.welcomeImageUploadId}/preview`}
                alt={values.welcomeImageAltText || ''}
                className="mt-4 max-h-40 w-full rounded border border-gray-200 object-cover"
              />
            ) : (
              <div className="mt-4 flex h-32 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-100 text-sm text-gray-500">
                Platzhalter (kein Bild)
              </div>
            )}
            {values.welcomeSections
              .filter((section) => section.title.trim())
              .map((section) => (
                <div
                  key={section._key ?? section.title}
                  className="mt-3 border-t border-gray-200 pt-3"
                >
                  <p className="font-medium text-gray-900">{section.title}</p>
                  {section.bodyMarkdown ? <Markdown markdown={section.bodyMarkdown} /> : null}
                </div>
              ))}
          </div>
        )
      }}
    </form.Subscribe>
  )
}

export function RegionWelcomeEditor({ form, regionId, regionSlug }: Props) {
  return (
    <div className="space-y-4">
      <RadioGroup
        inline
        form={form}
        name="welcomeEnabled"
        label="Willkommens-Dialog aktiv"
        items={[
          { value: 'true', label: 'Ja' },
          { value: 'false', label: 'Nein' },
        ]}
      />
      <form.Subscribe selector={(state) => state.values.welcomeEnabled}>
        {(welcomeEnabled) =>
          welcomeEnabled === 'true' ? (
            <>
              <TextField form={form} name="welcomeTitle" label="Titel" />
              <TextField form={form} name="welcomeSubtitle" label="Untertitel" optional />
              <MarkdownEditorField
                form={form}
                name="welcomeBodyMarkdown"
                label="Intro (Markdown)"
                optional
              />
              <form.Subscribe selector={(state) => state.values.welcomeImageUploadId}>
                {(uploadId) => (
                  <WelcomeImageEditor
                    form={form}
                    uploadId={uploadId}
                    regionId={regionId}
                    regionSlug={regionSlug}
                    onUploadIdChange={(nextUploadId) =>
                      form.setFieldValue('welcomeImageUploadId', nextUploadId)
                    }
                    onRemove={() => {
                      form.setFieldValue('welcomeImageUploadId', '')
                      form.setFieldValue('welcomeImageAltText', '')
                    }}
                  />
                )}
              </form.Subscribe>
              <form.Field name="welcomeSections">
                {(field) => (
                  <WelcomeSectionsEditor
                    sections={field.state.value}
                    onChange={(sections) => field.handleChange(sections)}
                  />
                )}
              </form.Field>
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700">Vorschau</h3>
                <WelcomePreview form={form} />
              </div>
            </>
          ) : null
        }
      </form.Subscribe>
    </div>
  )
}
