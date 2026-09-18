import { TrashIcon } from '@heroicons/react/20/solid'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { adminAsideIconButtonClassName } from '@/components/admin/adminClasses'
import { useAdminAsideVariant } from '@/components/admin/aside/adminAsideSection'
import { ConfirmDialog } from '@/components/shared/dialog/ConfirmDialog'

export type AdminDeleteConfirmProps = {
  /** Dialog title, e.g. „Region löschen?“ */
  title: string
  description?: ReactNode
  /** Defaults to „Löschen“ (memberships: „Entfernen“). */
  confirmLabel?: string
  /** Runs on confirm. Throw (e.g. `new Error(result.message)`) to show the error in the dialog. */
  onDelete: () => void | Promise<void>
}

type AdminDeleteConfirmDialogProps = AdminDeleteConfirmProps & {
  open: boolean
  setOpen: (open: boolean) => void
}

/** Danger `ConfirmDialog` for table and aside deletes. */
export const AdminDeleteConfirmDialog = ({
  open,
  setOpen,
  title,
  description,
  confirmLabel = 'Löschen',
  onDelete,
}: AdminDeleteConfirmDialogProps) => (
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

type Props = {
  /** Row text, e.g. „Region löschen“ (icon-only + sr-only on mobile). */
  label: string
} & Pick<AdminDeleteConfirmProps, 'title' | 'description' | 'onDelete' | 'confirmLabel'>

const desktopClassName = twMerge(
  'group flex w-full items-center gap-x-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-gray-700',
  'hover:bg-red-50 hover:text-red-700 focus-visible:bg-red-50 focus-visible:text-red-700 focus-visible:outline-2 focus-visible:outline-red-500',
)

const mobileClassName = twMerge(
  adminAsideIconButtonClassName,
  'hover:bg-red-50 hover:text-red-700 focus-visible:text-red-700 focus-visible:outline-red-500',
)

/** Destructive aside action (edit / detail pages): gray row that turns red on hover, confirms in a danger dialog. */
export const AdminDeleteButton = ({ label, ...confirm }: Props) => {
  const [open, setOpen] = useState(false)
  const variant = useAdminAsideVariant()
  const dialog = <AdminDeleteConfirmDialog open={open} setOpen={setOpen} {...confirm} />

  if (variant === 'desktop') {
    return (
      <div className="-mx-2">
        <button type="button" onClick={() => setOpen(true)} className={desktopClassName}>
          <TrashIcon
            aria-hidden="true"
            className="size-5 shrink-0 text-gray-400 group-hover:text-red-600 group-focus-visible:text-red-600"
          />
          <span className="min-w-0 flex-1">{label}</span>
        </button>
        {dialog}
      </div>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={mobileClassName}>
        <TrashIcon aria-hidden="true" className="size-5" />
        <span className="sr-only">{label}</span>
      </button>
      {dialog}
    </>
  )
}
