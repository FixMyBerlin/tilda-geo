import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

export type DeleteConfirmProps = {
  /** Dialog title naming the object, e.g. „Ordner „Baustellen“ löschen?“ */
  title: string
  description?: ReactNode
  /** Defaults to „Löschen“ (memberships: „Entfernen“). */
  confirmLabel?: string
  /** Runs on confirm. Throw (e.g. `new Error(result.message)`) to show the error in the dialog. */
  onDelete: () => void | Promise<void>
}

type Props = DeleteConfirmProps & {
  open: boolean
  setOpen: (open: boolean) => void
}

/**
 * Every delete of stored data (admin and region modes) goes through this dialog. The caller
 * keeps the `open` state and opens it from its trigger; the dialog closes once `onDelete` resolves.
 */
export const DeleteConfirmDialog = ({
  open,
  setOpen,
  title,
  description,
  confirmLabel = 'Löschen',
  onDelete,
}: Props) => (
  <ConfirmDialog
    open={open}
    setOpen={setOpen}
    tone="danger"
    icon={ExclamationTriangleIcon}
    title={title}
    description={description}
    confirmLabel={confirmLabel}
    onConfirm={async () => {
      await onDelete()
      setOpen(false)
    }}
  />
)
