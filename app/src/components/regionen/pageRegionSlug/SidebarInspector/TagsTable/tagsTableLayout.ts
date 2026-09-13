export const tagsTableContainerClass = '@container w-full min-w-0'

/** Overrides `text-sm` default line-height so all inspector table text aligns. */
export const tagsTableLeadingClass = 'leading-4'

/** `table-auto` (not fixed): label shrinks to content, value takes remaining width. */
export const tagsTableClass = `block w-full @[350px]:table ${tagsTableLeadingClass}`

export const tagsTableBodyClass =
  'block divide-y divide-gray-200 border-b border-gray-200 @[350px]:table-row-group'

export const tagsTableRowClass =
  'group block @[350px]:table-row [&>td]:px-2 [&>td:only-child]:py-2 [&>td:first-child:not(:last-child)]:pt-2 [&>td:first-child:not(:last-child)]:pb-1 [&>td:last-child:not(:first-child)]:pt-1 [&>td:last-child:not(:first-child)]:pb-2 @[350px]:[&>td]:py-2'

/** `w-px` + nowrap = classic shrink-to-fit label column; value cell grows via `w-full`. */
export const tagsTableLabelCellClass = `block w-full min-w-0 text-sm ${tagsTableLeadingClass} font-medium wrap-anywhere @[350px]:table-cell @[350px]:w-px @[350px]:whitespace-nowrap @[350px]:align-top @[350px]:pr-2 @[350px]:pl-2`

export const tagsTableValueCellClass = `block w-full min-w-0 text-sm ${tagsTableLeadingClass} wrap-anywhere @[350px]:table-cell @[350px]:w-full @[350px]:align-top @[350px]:px-2`

/** Nested container so sub-rows react to the value-cell width, not the full inspector. */
export const tagsTableCompositTableClass = `@container w-full min-w-0 ${tagsTableLeadingClass}`

export const tagsTableCompositRowClass = 'border-t border-gray-200 py-1 first:border-t-0'

/**
 * Nested composit rows (surface/smoothness, bikelanes, …).
 * Stack label above value when the value cell is narrow; side-by-side once there is room for both cols.
 */
export const tagsTableCompositSubLabelCellClass = `w-full min-w-0 py-1 text-left align-top ${tagsTableLeadingClass} font-medium wrap-anywhere @[280px]:w-28 @[280px]:min-w-28 @[280px]:shrink-0 @[280px]:pr-1.5 @[280px]:whitespace-nowrap`

export const tagsTableCompositSubValueCellClass = `w-full min-w-0 py-1 ${tagsTableLeadingClass} break-words @[280px]:flex-1`

/** Header row for a composit sub-entry; disclosure body sits below and spans full width. */
export const tagsTableCompositSubRowHeaderClass =
  'flex flex-col items-stretch @[280px]:flex-row @[280px]:items-start'
