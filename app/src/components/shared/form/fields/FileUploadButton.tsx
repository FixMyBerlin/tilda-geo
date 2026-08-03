import { PhotoIcon } from '@heroicons/react/24/solid'
import { twJoin } from 'tailwind-merge'
import { buttonStylesSecondary } from '@/components/shared/links/styles'

type Props = {
  accept: string
  label: string
  onFile: (file: File) => void
  disabled?: boolean
  isPending?: boolean
  pendingLabel?: string
  id?: string
  className?: string
}

/** Label styled as a secondary button; native file input is visually hidden (`sr-only`). */
export function FileUploadButton({
  accept,
  label,
  onFile,
  disabled = false,
  isPending = false,
  pendingLabel = 'Lädt hoch…',
  id,
  className,
}: Props) {
  const isDisabled = disabled || isPending

  return (
    <div className={twJoin('flex flex-wrap items-center gap-3', className)}>
      <label
        htmlFor={id}
        className={twJoin(
          buttonStylesSecondary,
          'cursor-pointer gap-2',
          isDisabled && 'pointer-events-none cursor-not-allowed opacity-60',
        )}
      >
        <PhotoIcon className="size-5 shrink-0 text-gray-500" aria-hidden />
        <span>{isPending ? pendingLabel : label}</span>
        <input
          id={id}
          type="file"
          accept={accept}
          disabled={isDisabled}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            // Clear so the same path can be re-selected.
            event.target.value = ''
            if (!file) return
            onFile(file)
          }}
        />
      </label>
    </div>
  )
}
