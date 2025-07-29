import React from 'react'
import { twJoin } from 'tailwind-merge'
import { SourcesId } from '../../../_mapData/mapDataSources/sources.const'
import { TagsTableRowValueWithTooltip } from './TagsTableRowValueWithTooltip'
import { NodataFallback } from './compositTableRows/NodataFallback'
import { ConditionalFormattedKey } from './translations/ConditionalFormattedKey'

export type TagsTableRowProps =
  | {
      sourceId: SourcesId | string // string = StaticDatasetsIds
      tagKey: string
      /** @desc `null` renders <NodataFallback> */
      tagValue: string | null
      children?: never
    }
  | {
      sourceId: SourcesId | string // string = StaticDatasetsIds
      tagKey: string
      tagValue?: never
      children: React.ReactNode
    }

export const TagsTableRow = ({ sourceId, tagKey, tagValue, children }: TagsTableRowProps) => {
  const secondaryRowPrefixes = ['tilda_']
  const isSecodaryRow = secondaryRowPrefixes.some((e) => tagKey.startsWith(e))

  return (
    <tr className="group">
      <td
        className={twJoin(
          'w-2/5 py-2 pl-4 pr-3 text-sm font-medium',
          isSecodaryRow ? 'text-gray-400 group-hover:text-gray-900' : 'text-gray-900',
        )}
      >
        <ConditionalFormattedKey sourceId={sourceId} tagKey={tagKey} />
      </td>
      <td
        className={twJoin(
          'px-3 py-2 text-sm',
          isSecodaryRow ? 'text-gray-400 group-hover:text-gray-500' : 'text-gray-500',
        )}
      >
        {tagValue === null && <NodataFallback />}
        {tagValue === undefined && !children && <NodataFallback />}
        {tagValue && (
          <TagsTableRowValueWithTooltip sourceId={sourceId} tagKey={tagKey} tagValue={tagValue} />
        )}
        {children && <>{children}</>}
      </td>
    </tr>
  )
}
