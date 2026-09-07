import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { ZodError } from 'zod'
import { FileUploadDropzone } from '@/components/shared/form/fields/FileUploadDropzone'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import {
  classifyImportFeatures,
  reviewFeatureCollectionSchema,
  type ClassifiedImportFeature,
  type ImportFeatureClassification,
} from '@/shared/reviewLists/reviewEntryImport'

const GEOJSON_ACCEPT = '.geojson,.json,application/geo+json,application/json'
const REVIEW_UPLOAD_MAX_BYTES = 10 * 1024 * 1024

type ExistingFeature = Parameters<typeof classifyImportFeatures>[1][number]

type Props = {
  open: boolean
  isPending: boolean
  error: string | null
  createdCount: number | null
  existingFeatures: readonly ExistingFeature[]
  existingFeaturesReady: boolean
  onClose: () => void
  onErrorDismiss: () => void
  onConfirm: (file: File) => void
}

const readFileText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Datei konnte nicht gelesen werden.'))
    reader.readAsText(file)
  })

const formatParseError = (error: unknown) => {
  if (error instanceof ZodError) {
    return `Ungültiges GeoJSON: ${error.issues[0]?.message ?? error.message}`
  }
  if (error instanceof SyntaxError) {
    return 'Die Datei ist kein gültiges JSON.'
  }
  if (error instanceof Error && error.message) return error.message
  return 'Die Datei konnte nicht gelesen werden.'
}

const previewJson = (item: ClassifiedImportFeature) =>
  JSON.stringify(
    {
      id: item.fromFile ? item.id : undefined,
      geometryType: item.geometryType,
      properties: item.properties,
    },
    null,
    2,
  )

const ImportBucketDisclosure = ({
  title,
  description,
  items,
  defaultOpen = false,
}: {
  title: string
  description?: string
  items: ClassifiedImportFeature[]
  defaultOpen?: boolean
}) => {
  return (
    <Disclosure as="div" defaultOpen={defaultOpen} className="rounded-lg border border-gray-200">
      {({ open }) => (
        <>
          <DisclosureButton className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50">
            <span>{title}</span>
            <ChevronRightIcon
              className={twJoin(
                'size-4 shrink-0 text-gray-500 transition-transform',
                open && 'rotate-90',
              )}
              aria-hidden
            />
          </DisclosureButton>
          <DisclosurePanel className="max-h-48 space-y-2 overflow-y-auto border-t border-gray-200 px-3 py-2">
            {description ? <p className="text-sm text-gray-600">{description}</p> : null}
            {items.length === 0 ? (
              <p className="text-xs text-gray-500">Keine Features.</p>
            ) : (
              items.map((item, index) => (
                <pre key={`${item.id}-${index}`} className="overflow-x-auto text-xs">
                  {previewJson(item)}
                </pre>
              ))
            )}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  )
}

/** Append-only GeoJSON upload: parse preview (neu / ignoriert / ohne ID), then filtered upload. */
export const ReviewListGeojsonUploadModal = ({
  open,
  isPending,
  error,
  createdCount,
  existingFeatures,
  existingFeaturesReady,
  onClose,
  onErrorDismiss,
  onConfirm,
}: Props) => {
  const [parseError, setParseError] = useState<string | null>(null)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [classification, setClassification] = useState<ImportFeatureClassification | null>(null)

  const resetPreview = () => {
    setParseError(null)
    setSourceFile(null)
    setClassification(null)
  }

  const displayError = parseError ?? error
  const neuCount = classification?.neu.length ?? 0
  const ignoredCount = classification?.ignoriert.length ?? 0
  const ohneIdCount = classification?.ohneId.length ?? 0
  const canConfirm = classification !== null && neuCount + ohneIdCount > 0 && !isPending
  const showSuccess = createdCount !== null

  const handlePickedFile = async (file: File) => {
    onErrorDismiss()
    resetPreview()
    if (file.size > REVIEW_UPLOAD_MAX_BYTES) {
      setParseError('Die Datei ist größer als 10 MB.')
      return
    }
    if (!existingFeaturesReady) {
      setParseError('Die bestehenden Einträge werden noch geladen. Bitte warten Sie einen Moment.')
      return
    }
    try {
      const text = await readFileText(file)
      const collection = reviewFeatureCollectionSchema.parse(JSON.parse(text))
      setClassification(classifyImportFeatures(collection, existingFeatures))
      setSourceFile(file)
    } catch (caught) {
      setParseError(formatParseError(caught))
    }
  }

  const handleConfirm = () => {
    if (!sourceFile || !classification) return
    const filtered = {
      type: 'FeatureCollection' as const,
      features: [...classification.neu, ...classification.ohneId].map((item) => item.feature),
    }
    onConfirm(
      new File([JSON.stringify(filtered)], sourceFile.name, {
        type: sourceFile.type || 'application/geo+json',
      }),
    )
  }

  return (
    <ModalDialog
      title="GeoJSON hochladen"
      icon="reviewList"
      mode="reviewLists"
      buttonCloseName={isPending ? undefined : showSuccess ? 'Schließen' : 'Abbrechen'}
      open={open}
      setOpen={(next) => {
        if (!next && !isPending) onClose()
      }}
      panelTestId="review-list-geojson-upload-modal"
      onExitComplete={resetPreview}
      primaryAction={
        showSuccess || !classification ? null : (
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className={twJoin(buttonStylesOnYellow, 'inline-flex w-full justify-center sm:w-auto')}
          >
            {isPending ? 'Wird hinzugefügt…' : 'Hinzufügen'}
          </button>
        )
      }
    >
      <div className="space-y-3">
        {showSuccess ? (
          <p className="text-sm text-gray-700">
            {createdCount === 1
              ? '1 Eintrag wurde hinzugefügt.'
              : `${createdCount} Einträge wurden hinzugefügt.`}
          </p>
        ) : (
          <>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                IDs werden aus <code className="text-xs">feature.id</code> oder{' '}
                <code className="text-xs">properties.id</code> gelesen. Neue IDs werden hinzugefügt.
                Bereits vorhandene IDs werden ignoriert — bestehende Einträge ändern Sie über das
                Attribute-Modal. Features ohne ID werden immer hinzugefügt und erhalten eine ID von
                TILDA. Werte werden als Text gespeichert; leere Werte entfallen.
              </p>
            </div>
            <FileUploadDropzone
              title="Datei hierher ziehen"
              subtitle="oder klicken zum Auswählen"
              dropTitle="Datei hier ablegen"
              description=".geojson / .json · max. 10 MB"
              accept={GEOJSON_ACCEPT}
              isPending={isPending || !existingFeaturesReady}
              pendingLabel={
                existingFeaturesReady ? 'Wird hochgeladen…' : 'Bestehende Einträge werden geladen…'
              }
              disabled={isPending || !existingFeaturesReady}
              error={displayError}
              onErrorDismiss={() => {
                setParseError(null)
                onErrorDismiss()
              }}
              onFile={handlePickedFile}
            />
            {classification ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  {neuCount} neu, {ignoredCount} ignoriert, {ohneIdCount} ohne ID
                </p>
                <ImportBucketDisclosure
                  title={`Wird hinzugefügt (${neuCount})`}
                  items={classification.neu}
                />
                <ImportBucketDisclosure
                  title={`Wird ignoriert (${ignoredCount})`}
                  description="Bestehende Einträge werden nicht überschrieben. Bearbeiten Sie sie in der Eintragsdetailansicht."
                  items={classification.ignoriert}
                />
                {ohneIdCount > 0 ? (
                  <ImportBucketDisclosure
                    title={`Ohne ID – wird hinzugefügt (${ohneIdCount})`}
                    description="Diese Features haben keine ID in der Datei, daher vergibt TILDA eine. Ein erneuter Import der ursprünglichen Quelldatei fügt sie wieder hinzu, weil die Datei keine ID zum Abgleich hat. Ein Re-Import eines TILDA-Exports wird erkannt. Um das zu vermeiden, fügen Sie in der Quelldatei eine id hinzu."
                    items={classification.ohneId}
                  />
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </ModalDialog>
  )
}
