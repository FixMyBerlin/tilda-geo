import { twMerge } from 'tailwind-merge'

export type AdminTableHeaderCell = string | { id: string; label: string }

const cellPad = 'px-3 py-2'

const td = twMerge(cellPad, 'text-sm text-gray-800')

/** Class strings for admin tables — use as `adminTableClasses.table`, `adminTableClasses.td`, etc. */
export const adminTableClasses = {
  /** `<table>` — shell, rounded surface, divider under header. */
  table: twMerge(
    'relative min-w-full overflow-clip rounded-xl bg-white/90 shadow-sm ring-1 ring-gray-900/5',
    'divide-y divide-gray-200',
  ),
  /** `<thead><tr>` */
  headRow: 'bg-white/90',
  /** `<tbody>` — row dividers + body surface */
  body: 'divide-y divide-gray-200 bg-white/40',
  /** `<th scope="col">` */
  th: twMerge(cellPad, 'text-left align-middle text-sm font-semibold text-gray-900'),
  /** `<th scope="col">` — left-aligned (alias; prefer `th`). */
  thLeft: twMerge(cellPad, 'text-left align-middle text-sm font-semibold text-gray-900'),
  /** `<td>` */
  td,
  /** `<th scope="row">` in tbody — row title / first column. */
  thRow: twMerge(td, 'text-left font-medium text-gray-900'),
  /** Wrapper for `AdminTable` + `PaginationControls` (strips inner table shell). */
  paginatedShell: twMerge(
    'overflow-hidden rounded-xl bg-white/90 shadow-sm ring-1 ring-gray-900/5',
    '[&>table]:rounded-none [&>table]:bg-transparent [&>table]:shadow-none [&>table]:ring-0',
  ),
} as const

export const AdminTable = ({
  header,
  children,
}: {
  header: AdminTableHeaderCell[]
  children: React.ReactNode
}) => {
  return (
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
              <th key={cell.id} scope="col" className={adminTableClasses.th}>
                {cell.label}
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody className={adminTableClasses.body}>{children}</tbody>
    </table>
  )
}
