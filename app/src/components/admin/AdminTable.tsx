import type { ReactNode } from 'react'
import { twJoin, twMerge } from 'tailwind-merge'
import { adminCardClassName } from '@/components/admin/adminClasses'

export type AdminTableHeaderCell =
  | string
  | {
      id: string
      label: string
      /** Visually hidden header (e.g. “Aktionen” above row buttons). */
      srOnly?: boolean
      align?: 'left' | 'right'
    }

const cellPad = 'px-3 py-2.5 first:pl-4 last:pr-4 sm:first:pl-6 sm:last:pr-6'

const td = twJoin(cellPad, 'align-middle text-sm text-gray-700')

/** Class strings for admin tables — use as `adminTableClasses.td`, etc. Prefer `AdminTable` for the frame. */
export const adminTableClasses = {
  /** Card frame around a table (+ optional footer such as pagination); scrolls horizontally on narrow screens. */
  shell: twJoin(adminCardClassName, 'overflow-hidden'),
  /** `<table>` inside `shell`. */
  table: 'min-w-full divide-y divide-gray-200 text-left',
  /** `<thead><tr>` */
  headRow: 'bg-gray-50',
  /** `<tbody>` */
  body: 'divide-y divide-gray-200 bg-white',
  /** `<th scope="col">` */
  th: twJoin(
    cellPad,
    'text-left align-middle text-sm font-semibold whitespace-nowrap text-gray-900',
  ),
  /** `<td>` */
  td,
  /** `<th scope="row">` in tbody — row title / first column. */
  thRow: twJoin(td, 'text-left font-medium text-gray-900'),
  /** `<tr>` separating groups inside a table (e.g. regions by contract); pair with `groupHeader`. */
  groupRow: 'border-t border-gray-200 bg-gray-50',
  /** `<th scope="colgroup" colSpan={…}>` inside `groupRow`. */
  groupHeader: twJoin(cellPad, 'py-2 text-left text-sm font-semibold text-gray-900'),
} as const

type Props = {
  header: AdminTableHeaderCell[]
  children: ReactNode
  /** Rendered inside the card below the table (e.g. `AdminPagination`). */
  footer?: ReactNode
  className?: string
}

export const AdminTable = ({ header, children, footer, className }: Props) => {
  return (
    <div className={twMerge(adminTableClasses.shell, className)}>
      <div className="overflow-x-auto">
        <table className={adminTableClasses.table}>
          <thead>
            <tr className={adminTableClasses.headRow}>
              {header.map((cell) => {
                if (typeof cell === 'string') {
                  return (
                    <th key={cell} scope="col" className={adminTableClasses.th}>
                      {cell}
                    </th>
                  )
                }
                return (
                  <th
                    key={cell.id}
                    scope="col"
                    className={twJoin(adminTableClasses.th, cell.align === 'right' && 'text-right')}
                  >
                    {cell.srOnly ? <span className="sr-only">{cell.label}</span> : cell.label}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className={adminTableClasses.body}>{children}</tbody>
        </table>
      </div>
      {footer}
    </div>
  )
}
