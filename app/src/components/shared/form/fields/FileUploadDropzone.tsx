import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useId, useState } from 'react'
import { twJoin } from 'tailwind-merge'

type Props = {
  /** Idle headline inside the dashed area. */
  title: string
  /** Secondary hint under the title (e.g. click-to-select). */
  subtitle: string
  /** Overlay text while a file is dragged over the area. */
  dropTitle: string
  accept: string
  onFile: (file: File) => void
  /** Extra line under subtitle (file types / size). */
  description?: string
  pendingLabel?: string
  isPending?: boolean
  disabled?: boolean
  error?: string | null
  onErrorDismiss?: () => void
  id?: string
  className?: string
  /** Stretch to fill a sized parent instead of using intrinsic height. */
  fillContainer?: boolean
}

/**
 * Presentational single-file drag-and-drop / click-to-pick area.
 * Callers own all copy and upload/parse logic (`onFile` only).
 */
export function FileUploadDropzone({
  title,
  subtitle,
  dropTitle,
  accept,
  onFile,
  description,
  pendingLabel = 'Wird hochgeladen…',
  isPending = false,
  disabled = false,
  error,
  onErrorDismiss,
  id: idProp,
  className,
  fillContainer = false,
}: Props) {
  const reactId = useId()
  const inputId = idProp ?? reactId
  const [isDragActive, setIsDragActive] = useState(false)
  const isDisabled = disabled || isPending

  const takeFile = (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file || isDisabled) return
    onFile(file)
  }

  return (
    <div className={twJoin('flex flex-col gap-3', fillContainer && 'h-full', className)}>
      <div
        className={twJoin(
          'relative rounded-lg border border-dashed transition-colors',
          fillContainer && 'h-full',
          isDragActive ? 'border-blue-500' : 'border-gray-300',
          isDisabled && 'opacity-60',
        )}
      >
        <label
          htmlFor={inputId}
          onDragEnter={(event) => {
            event.preventDefault()
            if (!isDisabled) setIsDragActive(true)
          }}
          onDragOver={(event) => {
            event.preventDefault()
            if (!isDisabled) setIsDragActive(true)
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            setIsDragActive(false)
          }}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragActive(false)
            takeFile(event.dataTransfer.files)
          }}
          className={twJoin(
            'flex w-full flex-col items-center justify-center rounded-lg bg-white px-2 py-6 transition-colors',
            fillContainer ? 'h-full' : 'min-w-72',
            isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50',
            isDragActive && 'opacity-0',
          )}
        >
          <ArrowUpTrayIcon className="size-6 text-gray-700" aria-hidden />
          <div className="mt-3 space-y-1 text-center">
            <p className="text-sm font-semibold text-gray-900">
              {isPending ? pendingLabel : title}
            </p>
            {!isPending ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
            {description && !isPending ? (
              <p className="max-w-64 text-xs text-gray-500">{description}</p>
            ) : null}
          </div>
          <input
            id={inputId}
            type="file"
            accept={accept}
            disabled={isDisabled}
            className="sr-only"
            onChange={(event) => {
              takeFile(event.target.files)
              event.target.value = ''
            }}
          />
        </label>

        {isDragActive ? (
          <div className="pointer-events-none absolute inset-0 rounded-lg bg-blue-50">
            <div className="flex size-full flex-col items-center justify-center">
              <ArrowUpTrayIcon className="size-6 text-blue-700" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-blue-900">{dropTitle}</p>
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <p className="grow">{error}</p>
          {onErrorDismiss ? (
            <button
              type="button"
              onClick={onErrorDismiss}
              className="shrink-0 rounded p-1 hover:bg-red-100"
              aria-label="Fehler schließen"
            >
              <XMarkIcon className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
