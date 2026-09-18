import {
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/20/solid'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { twJoin, twMerge } from 'tailwind-merge'
import {
  type AdminDeleteConfirmProps,
  AdminDeleteConfirmDialog,
} from '@/components/admin/AdminDeleteButton'
import type { AdminLinkTarget } from '@/components/admin/aside/AdminAsideActions'
import { Link } from '@/components/shared/links/Link'

const compactButtonClassName =
  'inline-flex items-center gap-x-1 rounded-md px-2.5 py-1 text-sm font-semibold whitespace-nowrap text-gray-800 no-underline shadow-xs hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500'

const editLinkClassName = twJoin(compactButtonClassName, 'bg-yellow-100 hover:bg-yellow-400')

const viewLinkClassName = twJoin(
  compactButtonClassName,
  'bg-white ring-1 ring-yellow-300 hover:bg-yellow-50 hover:ring-yellow-400',
)

const externalLinkClassName =
  'inline-flex items-center gap-x-1 text-sm font-medium whitespace-nowrap text-gray-700 underline decoration-yellow-600 underline-offset-4 hover:text-yellow-700'

const deleteButtonClassName =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-gray-500 ring-1 ring-gray-300 hover:bg-red-50 hover:text-red-700 hover:ring-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50'

type AdminTableActionsProps = {
  children: ReactNode
  className?: string
}

/** Right-aligned action cell content; order: view/edit → external → delete. */
export const AdminTableActions = ({ children, className }: AdminTableActionsProps) => (
  <div className={twMerge('flex items-center justify-end gap-x-2', className)}>{children}</div>
)

type AdminTableLinkProps = AdminLinkTarget & { children?: ReactNode }

export const AdminTableEditLink = ({ children = 'Bearbeiten', ...target }: AdminTableLinkProps) => (
  <Link {...target} classNameOverwrite={editLinkClassName}>
    <PencilSquareIcon aria-hidden="true" className="-ml-0.5 size-4 shrink-0" />
    {children}
  </Link>
)

export const AdminTableViewLink = ({ children = 'Anzeigen', ...target }: AdminTableLinkProps) => (
  <Link {...target} classNameOverwrite={viewLinkClassName}>
    <EyeIcon aria-hidden="true" className="-ml-0.5 size-4 shrink-0 text-gray-500" />
    {children}
  </Link>
)

type AdminTableExternalLinkProps = (AdminLinkTarget | { href: string }) & { children?: ReactNode }

/** Opens in a new tab — e.g. „Karte“ to the public region map. */
export const AdminTableExternalLink = ({
  children = 'Karte',
  ...target
}: AdminTableExternalLinkProps) => {
  const content = (
    <>
      {children}
      <ArrowTopRightOnSquareIcon aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="sr-only"> (öffnet in neuem Fenster)</span>
    </>
  )
  if ('href' in target) {
    return (
      <Link href={target.href} blank classNameOverwrite={externalLinkClassName}>
        {content}
      </Link>
    )
  }
  return (
    <Link {...target} blank classNameOverwrite={externalLinkClassName}>
      {content}
    </Link>
  )
}

type AdminTableDeleteButtonProps = AdminDeleteConfirmProps & {
  /** Accessible name + tooltip, e.g. „Region berlin löschen“. */
  label: string
  disabled?: boolean
}

/** Icon-only row delete; confirms in a danger `ConfirmDialog`. */
export const AdminTableDeleteButton = ({
  label,
  disabled,
  ...confirm
}: AdminTableDeleteButtonProps) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        title={label}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={deleteButtonClassName}
      >
        <TrashIcon aria-hidden="true" className="size-4" />
        <span className="sr-only">{label}</span>
      </button>
      <AdminDeleteConfirmDialog open={open} setOpen={setOpen} {...confirm} />
    </>
  )
}
