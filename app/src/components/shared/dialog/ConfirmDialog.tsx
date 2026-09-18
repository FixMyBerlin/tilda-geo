import type { ReactNode } from 'react'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { buttonStyles, buttonStylesSecondary } from '@/components/shared/links/styles'
import { type ModalCustomIcon, ModalDialog } from '@/components/shared/Modal/ModalDialog'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'

type ConfirmDialogTone = 'primary' | 'danger'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  title: string
  description?: ReactNode
  children?: ReactNode
  /** Heroicon component, e.g. `ExclamationTriangleIcon` from `@heroicons/react/24/outline`. */
  icon: ModalCustomIcon['Icon']
  confirmLabel: string
  cancelLabel?: string
  /**
   * Runs on confirm; may reject to show `error` and keep the dialog open. On success the dialog
   * stays open — call `setOpen(false)` from `onConfirm` (or after) to close it.
   */
  onConfirm: () => void | Promise<void>
  tone?: ConfirmDialogTone
}

const dangerButtonClassName = twJoin(
  'inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-red-600 px-4 py-2 leading-4 font-semibold text-white no-underline shadow-sm select-none hover:bg-red-500 focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
)

/** Confirm/cancel dialog on top of `ModalDialog`. Manages its own pending/error state around `onConfirm`. */
export const ConfirmDialog = ({
  open,
  setOpen,
  title,
  description,
  children,
  icon: Icon,
  confirmLabel,
  cancelLabel = 'Abbrechen',
  onConfirm,
  tone = 'primary',
}: Props) => {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    setPending(true)
    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Da ist etwas schiefgelaufen.')
    } finally {
      setPending(false)
    }
  }

  return (
    <ModalDialog
      title={title}
      icon={{
        Icon,
        bgClass: tone === 'danger' ? 'bg-red-100' : 'bg-gray-100',
        iconClass: tone === 'danger' ? 'text-red-600' : 'text-gray-600',
      }}
      open={open}
      setOpen={(value) => {
        if (pending) return
        setOpen(value)
      }}
      primaryAction={
        <>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className={twJoin(
              tone === 'danger' ? dangerButtonClassName : buttonStyles,
              'w-full justify-center sm:w-auto',
            )}
          >
            {pending ? <SmallSpinner /> : confirmLabel}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={pending}
            className={twJoin(
              buttonStylesSecondary,
              'mt-3 w-full justify-center sm:mt-0 sm:w-auto',
            )}
          >
            {cancelLabel}
          </button>
        </>
      }
    >
      {description ? <p className="text-sm text-gray-700">{description}</p> : null}
      {children}
      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </ModalDialog>
  )
}
