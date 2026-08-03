export const tagsTableContainerClass = '@container w-full min-w-0'

export const tagsTableClass = 'block w-full @[350px]:table @[350px]:table-fixed'

export const tagsTableRowClass = 'group block @[350px]:table-row'

export const tagsTableLabelCellClass =
  'block w-full min-w-0 px-4 pt-2 pb-0 text-sm font-medium wrap-anywhere @[350px]:table-cell @[350px]:w-[36%] @[350px]:align-top @[350px]:py-2 @[350px]:pr-3 @[350px]:pl-4'

export const tagsTableValueCellClass =
  'block w-full min-w-0 px-4 pt-2 pb-2 text-sm wrap-anywhere @[350px]:table-cell @[350px]:w-[64%] @[350px]:align-top @[350px]:px-3 @[350px]:py-2'

export const tagsTableCompositTableClass = 'w-full table-fixed leading-4'

/** Nested composit rows (surface/smoothness, bikelanes, …): keep sub-labels on one line when possible. */
export const tagsTableCompositSubLabelCellClass =
  'w-28 min-w-28 shrink-0 py-1 pr-2 text-left align-top font-medium wrap-anywhere @[350px]:whitespace-nowrap'

export const tagsTableCompositSubValueCellClass = 'min-w-0 flex-1 py-1 wrap-anywhere'

/** Header row for a composit sub-entry; disclosure body sits below and spans full width. */
export const tagsTableCompositSubRowHeaderClass = 'flex items-start'
