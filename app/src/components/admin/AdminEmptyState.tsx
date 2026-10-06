import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { adminCardClassName } from '@/components/admin/adminClasses'

type Props = {
  /** „Noch keine … vorhanden.“ or „Keine … für diesen Filter.“ */
  children: ReactNode
  /** Optional follow-up, e.g. a create link or „Filter zurücksetzen“. */
  action?: ReactNode
  /** Inside an `AdminFormSection` the card frame is dropped. */
  bare?: boolean
}

/** Replaces an `AdminTable` (or list) that has no rows. */
export const AdminEmptyState = ({ children, action, bare = false }: Props) => (
  <div className={twJoin(!bare && adminCardClassName, bare ? 'py-2' : 'px-6 py-10 text-center')}>
    <p className="text-sm text-gray-500">{children}</p>
    {action ? <div className={twJoin('mt-4 flex', !bare && 'justify-center')}>{action}</div> : null}
  </div>
)
