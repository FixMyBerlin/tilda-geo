import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import {
  modeDataTableContainerClass,
  modeDataTableHeadCellClass,
  modeDataTableHeadRowClass,
  modeDataTableListClass,
  modeDataTableTableClass,
} from './modeDataTable.const'

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
  <div className={modeDataTableContainerClass}>
    <div className={modeDataTableListClass}>{list}</div>
    <table className={modeDataTableTableClass}>
      <thead>
        <tr className={modeDataTableHeadRowClass}>
          {columns.map((column) => (
            <th
              key={column.id}
              scope="col"
              className={twJoin(modeDataTableHeadCellClass, column.className)}
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
