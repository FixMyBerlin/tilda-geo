import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'

type ModeDataTableColumn = {
  id: string
  label: string
  className?: string
}

type Props = {
  columns: ModeDataTableColumn[]
  list: ReactNode
  children: ReactNode
}

/** Container-query responsive data table: stacked list below `36rem`, table at `@[36rem]` and up. */
export const ModeDataTable = ({ columns, list, children }: Props) => (
  <div className="@container w-full min-w-0">
    <div className="@[36rem]:hidden">{list}</div>
    <table className="hidden w-full table-fixed @[36rem]:table">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-600">
          {columns.map((column) => (
            <th
              key={column.id}
              scope="col"
              className={twJoin('px-3 py-2 align-top', column.className)}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
)
